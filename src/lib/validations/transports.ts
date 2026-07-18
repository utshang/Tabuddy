import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

// Feature: 新增交通時間
export const addTransportSchema = z.object({
  after_activity_id: z.coerce.number().int(),
  // Rule: 時為必填且 >= 0
  hours: z.coerce.number().int().min(0, "時必須為大於等於 0 的整數"),
  // Rule: 分為必填且 >= 0 且 < 60
  minutes: z.coerce
    .number()
    .int()
    .min(0, "分必須為 0 到 59 之間的整數")
    .max(59, "分必須為 0 到 59 之間的整數"),
  // Rule: 交通工具名稱為必填
  mode: z.string().trim().min(1, "交通工具名稱為必填"),
  // 圖示為選填（自訂交通工具時可提供；未填寫則前端以名稱代替顯示）
  icon: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type AddTransportFormValues = z.input<typeof addTransportSchema>;

// Feature: 編輯交通時間
export const editTransportSchema = z.object({
  after_activity_id: z.coerce.number().int(),
  // Rule: 編輯後的時必須 >= 0
  hours: z.coerce.number().int().min(0, "時必須為大於等於 0 的整數"),
  // Rule: 編輯後的分必須 >= 0 且 < 60
  minutes: z.coerce
    .number()
    .int()
    .min(0, "分必須為 0 到 59 之間的整數")
    .max(59, "分必須為 0 到 59 之間的整數"),
  // Rule: 編輯後的交通工具為必填（trim 後不可為空字串）
  mode: z.string().trim().min(1, "交通工具名稱為必填"),
  // 圖示為選填；圖示的編輯限制（不可單獨編輯、改為預設選項時自動清除）由 resolveEditedTransportIcon 處理
  icon: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type EditTransportFormValues = z.input<typeof editTransportSchema>;
