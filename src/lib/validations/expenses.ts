import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

// 金額欄位：必填、> 0、最多至小數第二位
const amountSchema = z.coerce
  .number("金額為必填")
  .positive("金額必須大於 0")
  .refine(
    (v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6,
    "金額最多至小數第二位",
  );

// Feature: 新增開支
// 表單純量欄位（React Hook Form 用）；參與者與自訂分攤金額為動態欄位，由 action 另行驗證
export const addExpenseFormSchema = z.object({
  trip_id: z.coerce.number().int(),
  // Rule: 品項名稱為必填（trim 後不可為空字串）
  name: z.string().trim().min(1, "品項名稱為必填"),
  // Rule: 金額為必填且必須大於 0
  amount: amountSchema,
  // Rule: 類別為必填（trim 後不可為空字串）
  category: z.string().trim().min(1, "類別為必填"),
  // 圖示為選填（自定義類別時可提供；未填寫則前端以類別名稱文字顯示代替）
  category_icon: z.preprocess(emptyToUndefined, z.string().optional()),
  // Rule: 付款人為必填且必須是旅程團員（是否為團員由 action 驗證）
  payer_id: z.string().min(1, "付款人為必填"),
  // Rule: 開支日期未指定時預設為當天（預設值由前端以使用者裝置時區帶入）
  expense_date: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "開支日期格式須為 YYYY-MM-DD")
      .optional(),
  ),
  split_type: z.enum(["even", "custom"], "分攤方式須為均分或自訂金額"),
});

export type AddExpenseFormValues = z.input<typeof addExpenseFormSchema>;

// action 用的完整 schema
export const addExpenseSchema = addExpenseFormSchema.extend({
  // Rule: 參與分攤的團員至少一人
  participants: z.array(z.string().min(1)).min(1, "參與分攤的團員至少一人"),
});

// Feature: 編輯開支
// 表單純量欄位；與新增共用欄位規則，差異在於：
// - 以 expense_id 取代 trip_id（所屬旅程由開支本身決定）
// - Rule: 成員可以編輯開支的日期，日期不得為空（新增時未指定會預設為當天，編輯時必填）
export const editExpenseFormSchema = addExpenseFormSchema
  .omit({ trip_id: true, expense_date: true })
  .extend({
    expense_id: z.coerce.number().int(),
    expense_date: z
      .string()
      .min(1, "開支日期不得為空")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "開支日期格式須為 YYYY-MM-DD"),
  });

export type EditExpenseFormValues = z.input<typeof editExpenseFormSchema>;

// action 用的完整 schema
export const editExpenseSchema = editExpenseFormSchema.extend({
  // Rule: 成員可以編輯分攤方式與參與者，參與分攤的團員至少一人
  participants: z.array(z.string().min(1)).min(1, "參與分攤的團員至少一人"),
});

// 自訂分攤金額欄位：必填、>= 0（Rule: 分攤金額可為 0）、最多至小數第二位
export const customSplitAmountSchema = z.coerce
  .number("請為每位參與者填寫分攤金額")
  .min(0, "分攤金額不可為負數")
  .refine(
    (v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6,
    "分攤金額最多至小數第二位",
  );
