import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

// Feature: 新增行程
export const addActivitySchema = z.object({
  day_id: z.coerce.number().int(),
  // Rule: 行程名稱為必填（trim 後不可為空字串）
  name: z.string().trim().min(1, "行程名稱為必填"),
  // Rule: 新增行程時可一併填寫選填資訊（GoogleMap 連結）
  google_map_url: z.preprocess(
    emptyToUndefined,
    z.url("GoogleMap 連結格式錯誤").optional(),
  ),
  // Rule: 停留時間為必填，且不得為負數
  duration_minutes: z.coerce
    .number()
    .int()
    .min(0, "停留時間為必填，且不得為負數"),
  // Rule: 新增行程時可一併填寫選填資訊（備註）
  note: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type AddActivityFormValues = z.input<typeof addActivitySchema>;

// Feature: 編輯行程
export const editActivitySchema = z.object({
  // Rule: 成員可以編輯行程的名稱
  name: z.string().trim().min(1, "行程名稱為必填"),
  // Rule: 成員可以編輯行程的 GoogleMap 連結
  // Rule: 編輯後的 GoogleMap 連結必須為合法網址格式
  google_map_url: z.preprocess(
    emptyToUndefined,
    z.url("GoogleMap 連結格式錯誤").optional(),
  ),
  // Rule: 成員可以編輯行程的停留時間
  // Rule: 編輯後的停留時間不得為負數
  duration_minutes: z.coerce
    .number()
    .int()
    .min(0, "停留時間為必填，且不得為負數"),
  // Rule: 成員可以編輯行程的備註
  note: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type EditActivityFormValues = z.input<typeof editActivitySchema>;

// Feature: 調整行程順序
export const reorderActivitySchema = z.object({
  activity_id: z.coerce.number().int(),
  // Rule: 目標順序超出有效範圍時操作失敗（下限先驗證為正整數，上限於 action 中對照當日行程數量）
  target_order: z.coerce.number().int().min(1, "目標順序必須大於等於 1"),
});
