import { z } from "zod";

function emptyToUndefined(value: unknown) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

const TIME_FORMAT = /^([01]\d|2[0-3]):[0-5]\d$/;

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
  // Rule: 新增行程時可一併填寫指定時間
  // Rule: 指定時間若填寫，必須為合法時間格式（HH:MM）
  fixed_time: z.preprocess(
    emptyToUndefined,
    z.string().regex(TIME_FORMAT, "指定時間格式錯誤").optional(),
  ),
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
  // Rule: 成員可以編輯行程的指定時間
  // Rule: 指定時間可以被清除，清除後恢復以累加方式計算時間軸
  // Rule: 編輯後的指定時間必須為合法時間格式（HH:MM）
  fixed_time: z.preprocess(
    emptyToUndefined,
    z.string().regex(TIME_FORMAT, "指定時間格式錯誤").optional(),
  ),
});

export type EditActivityFormValues = z.input<typeof editActivitySchema>;

// Feature: 調整行程順序
export const reorderActivitySchema = z.object({
  activity_id: z.coerce.number().int(),
  // Rule: 目標順序超出有效範圍時操作失敗（下限先驗證為正整數，上限於 action 中對照當日行程數量）
  target_order: z.coerce.number().int().min(1, "目標順序必須大於等於 1"),
});

// Feature: 調整行程順序（Rule: 行程可跨天搬移）
export const moveActivityToDaySchema = z.object({
  activity_id: z.coerce.number().int(),
  target_day_id: z.coerce.number().int(),
  // Rule: 目標順序超出有效範圍時操作失敗（下限先驗證為正整數，上限於 action 中對照目標天行程數量）
  target_order: z.coerce.number().int().min(1, "目標順序必須大於等於 1"),
});
