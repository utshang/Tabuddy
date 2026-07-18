"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  addExpenseSchema,
  customSplitAmountSchema,
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
