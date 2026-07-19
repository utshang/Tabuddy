"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  addExpenseSchema,
  customSplitAmountSchema,
  editExpenseSchema,
} from "@/lib/validations/expenses";
import {
  centsToDecimalString,
  splitEvenlyCents,
  toCents,
} from "@/lib/expense-split";
import { resolveCategoryIcon } from "@/lib/expense-categories";

export type AddExpenseState = {
  error?: string;
  success?: boolean;
};

/** 以使用者裝置時區為準的當天日期由前端帶入；此為未帶值時的後備（伺服器當地時區）。 */
function serverToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Feature: 新增開支
 * 對應規格：spec/features/新增開支.feature
 */
export async function addExpense(
  _prevState: AddExpenseState,
  formData: FormData,
): Promise<AddExpenseState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Rule: 品項名稱為必填
  // Rule: 金額為必填且必須大於 0
  // Rule: 類別為必填
  // Rule: 付款人為必填且必須是旅程團員（必填部分）
  // Rule: 參與分攤的團員至少一人
  const parsed = addExpenseSchema.safeParse({
    trip_id: formData.get("trip_id"),
    name: formData.get("name"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    category_icon: formData.get("category_icon"),
    payer_id: formData.get("payer_id"),
    expense_date: formData.get("expense_date"),
    split_type: formData.get("split_type"),
    participants: formData.getAll("participants"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "新增開支失敗" };
  }

  const { trip_id, name, amount, category, payer_id, split_type } = parsed.data;

  // Rule: 使用者必須是旅程成員
  const membership = await prisma.tripMember.findUnique({
    where: { trip_id_user_id: { trip_id, user_id: user.id } },
  });
  if (!membership) {
    return { error: "你不是此旅程的成員" };
  }

  // 團員依加入旅程的先後順序排列（joined_at 為分配順序依據）
  const members = await prisma.tripMember.findMany({
    where: { trip_id },
    orderBy: [{ joined_at: "asc" }, { user_id: "asc" }],
  });
  const memberIds = new Set(members.map((m) => m.user_id));

  // Rule: 付款人為必填且必須是旅程團員（團員部分）
  if (!memberIds.has(payer_id)) {
    return { error: "付款人必須是旅程團員" };
  }

  // Rule: 參與者必須皆為旅程團員
  const participantIds = new Set(parsed.data.participants);
  if (![...participantIds].every((id) => memberIds.has(id))) {
    return { error: "參與者必須皆為旅程團員" };
  }

  // Rule: 付款人不必是分攤參與者（付款人可代墊不參與，不做付款人須在參與者名單內的檢查）

  // 參與者依加入旅程的先後順序排列
  const orderedParticipants = members
    .map((m) => m.user_id)
    .filter((id) => participantIds.has(id));

  const amountCents = toCents(amount);
  let splitCents: Array<{ user_id: string; cents: number }>;

  if (split_type === "even") {
    // Rule: 均分時金額平均分配至小數第二位，尾差以 0.01 依參與者加入旅程的先後順序分配給前幾位參與者
    // Rule: 分攤金額可為 0（極小金額均分時後位參與者可分得 0，不視為錯誤）
    const shares = splitEvenlyCents(amountCents, orderedParticipants.length);
    splitCents = orderedParticipants.map((user_id, i) => ({
      user_id,
      cents: shares[i],
    }));
  } else {
    // Rule: 分攤金額可為 0（自訂金額時參與者可指定 0 元，仍建立明細）
    splitCents = [];
    for (const user_id of orderedParticipants) {
      const parsedAmount = customSplitAmountSchema.safeParse(
        formData.get(`custom_amount_${user_id}`),
      );
      if (!parsedAmount.success) {
        return {
          error: parsedAmount.error.issues[0]?.message ?? "新增開支失敗",
        };
      }
      splitCents.push({ user_id, cents: toCents(parsedAmount.data) });
    }

    // Rule: 自訂金額時各參與者分攤金額之和必須等於開支金額
    const sumCents = splitCents.reduce((sum, s) => sum + s.cents, 0);
    if (sumCents !== amountCents) {
      return { error: "各參與者分攤金額之和必須等於開支金額" };
    }
  }

  // Rule: 開支日期未指定時預設為當天
  const expense_date = parsed.data.expense_date ?? serverToday();

  await prisma.expense.create({
    data: {
      trip_id,
      name,
      amount: centsToDecimalString(amountCents),
      category,
      // 圖示僅適用於自定義類別（預設類別的圖示由前端內建提供，不寫入此欄位）
      category_icon: resolveCategoryIcon({
        category,
        submittedIcon: parsed.data.category_icon ?? null,
      }),
      expense_date,
      payer_id,
      split_type,
      splits: {
        create: splitCents.map(({ user_id, cents }) => ({
          user_id,
          amount: centsToDecimalString(cents),
        })),
      },
    },
  });

  revalidatePath(`/trips/${trip_id}`);
  return { success: true };
}

export type DeleteExpenseState = {
  error?: string;
  success?: boolean;
};

/**
 * Feature: 刪除開支
 * 對應規格：spec/features/刪除開支.feature
 */
export async function deleteExpense(
  _prevState: DeleteExpenseState,
  formData: FormData,
): Promise<DeleteExpenseState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const expenseId = Number(formData.get("expense_id"));
  const submittedTripId = Number(formData.get("trip_id"));
  const confirmDeletion = formData.get("confirm_deletion") === "true";

  // Rule: 開支已被其他成員先行刪除時，刪除操作視為成功（冪等）
  // （開支已不存在時，改以前端傳入的 trip_id 檢查成員資格，通過後回報成功）
  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
  });
  const trip_id = expense?.trip_id ?? submittedTripId;

  // Rule: 使用者必須是旅程成員
  const membership = await prisma.tripMember.findUnique({
    where: { trip_id_user_id: { trip_id, user_id: user.id } },
  });
  if (!membership) {
    return { error: "你不是此旅程的成員" };
  }

  // Rule: 刪除開支需經使用者確認才會執行
  if (!confirmDeletion) {
    return { error: "請先確認刪除" };
  }

  // Rule: 成員可以刪除開支，不限付款人或分攤參與者
  // Rule: 刪除開支後其分攤明細一併刪除
  // （由資料庫層級的 ON DELETE CASCADE 外鍵約束保證）
  // deleteMany：開支在確認前一刻被其他成員刪除時影響 0 列，不拋錯，維持冪等成功
  await prisma.expense.deleteMany({ where: { id: expenseId } });

  revalidatePath(`/trips/${trip_id}`);
  return { success: true };
}

export type EditExpenseState = {
  error?: string;
  success?: boolean;
};

/**
 * Feature: 編輯開支
 * 對應規格：spec/features/編輯開支.feature
 */
export async function editExpense(
  _prevState: EditExpenseState,
  formData: FormData,
): Promise<EditExpenseState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Rule: 成員可以編輯開支的品項名稱，名稱不得為空
  // Rule: 成員可以編輯開支的金額，金額必須大於 0
  // Rule: 成員可以編輯開支的類別，類別不得為空
  // Rule: 成員可以編輯開支的日期，日期不得為空
  // Rule: 成員可以編輯分攤方式與參與者，參與分攤的團員至少一人
  const parsed = editExpenseSchema.safeParse({
    expense_id: formData.get("expense_id"),
    name: formData.get("name"),
    amount: formData.get("amount"),
    category: formData.get("category"),
    category_icon: formData.get("category_icon"),
    payer_id: formData.get("payer_id"),
    expense_date: formData.get("expense_date"),
    split_type: formData.get("split_type"),
    participants: formData.getAll("participants"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "編輯開支失敗" };
  }

  const { expense_id, name, amount, category, payer_id, expense_date, split_type } =
    parsed.data;

  const expense = await prisma.expense.findUnique({
    where: { id: expense_id },
  });
  if (!expense) {
    return { error: "找不到此開支" };
  }
  const trip_id = expense.trip_id;

  // Rule: 使用者必須是旅程成員
  const membership = await prisma.tripMember.findUnique({
    where: { trip_id_user_id: { trip_id, user_id: user.id } },
  });
  if (!membership) {
    return { error: "你不是此旅程的成員" };
  }

  // 團員依加入旅程的先後順序排列（joined_at 為均分尾差的分配順序依據）
  const members = await prisma.tripMember.findMany({
    where: { trip_id },
    orderBy: [{ joined_at: "asc" }, { user_id: "asc" }],
  });
  const memberIds = new Set(members.map((m) => m.user_id));

  // Rule: 成員可以編輯開支的付款人，付款人必須是旅程團員
  if (!memberIds.has(payer_id)) {
    return { error: "付款人必須是旅程團員" };
  }

  // Rule: 編輯後參與者必須皆為旅程團員
  const participantIds = new Set(parsed.data.participants);
  if (![...participantIds].every((id) => memberIds.has(id))) {
    return { error: "參與者必須皆為旅程團員" };
  }

  // Rule: 編輯分攤方式而未重新指定參與者時沿用原參與者名單
  // （前端表單以既有分攤明細預填參與者勾選；未變動時送出的即為原參與者名單）

  // 參與者依加入旅程的先後順序排列
  const orderedParticipants = members
    .map((m) => m.user_id)
    .filter((id) => participantIds.has(id));

  const amountCents = toCents(amount);
  let splitCents: Array<{ user_id: string; cents: number }>;

  if (split_type === "even") {
    // Rule: 編輯後採均分時金額平均分配至小數第二位，尾差以 0.01 依參與者加入旅程的先後順序分配給前幾位參與者
    const shares = splitEvenlyCents(amountCents, orderedParticipants.length);
    splitCents = orderedParticipants.map((user_id, i) => ({
      user_id,
      cents: shares[i],
    }));
  } else {
    splitCents = [];
    for (const user_id of orderedParticipants) {
      const parsedAmount = customSplitAmountSchema.safeParse(
        formData.get(`custom_amount_${user_id}`),
      );
      if (!parsedAmount.success) {
        return {
          error: parsedAmount.error.issues[0]?.message ?? "編輯開支失敗",
        };
      }
      splitCents.push({ user_id, cents: toCents(parsedAmount.data) });
    }

    // Rule: 編輯後採自訂金額時各參與者分攤金額之和必須等於開支金額
    // （自訂金額開支僅修改金額而未重新指定分攤時，原明細總和不等於新金額，於此擋下）
    const sumCents = splitCents.reduce((sum, s) => sum + s.cents, 0);
    if (sumCents !== amountCents) {
      return { error: "各參與者分攤金額之和必須等於開支金額" };
    }
  }

  // Rule: 編輯開支可同時修改任意欄位組合（表單一次提交全部欄位，整筆覆寫）
  // Rule: 自定義類別的名稱與圖示皆可編輯
  // Rule: 類別改為預設選項時圖示自動清除（resolveCategoryIcon 對預設類別一律回傳 null）
  await prisma.$transaction([
    prisma.expense.update({
      where: { id: expense_id },
      data: {
        name,
        amount: centsToDecimalString(amountCents),
        category,
        category_icon: resolveCategoryIcon({
          category,
          submittedIcon: parsed.data.category_icon ?? null,
        }),
        expense_date,
        payer_id,
        split_type,
      },
    }),
    // 分攤明細整批重建，維持不變條件：所有 expense_splits 的 amount 總和 = expenses.amount
    prisma.expenseSplit.deleteMany({ where: { expense_id } }),
    prisma.expenseSplit.createMany({
      data: splitCents.map(({ user_id, cents }) => ({
        expense_id,
        user_id,
        amount: centsToDecimalString(cents),
      })),
    }),
  ]);

  revalidatePath(`/trips/${trip_id}`);
  return { success: true };
}
