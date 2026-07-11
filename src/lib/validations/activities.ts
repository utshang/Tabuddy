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
  // Rule: 停留時間為必填，且必須大於 0
  duration_minutes: z.coerce
    .number()
    .int()
    .min(1, "停留時間為必填，且必須大於 0"),
  // Rule: 新增行程時可一併填寫選填資訊（備註）
  note: z.preprocess(emptyToUndefined, z.string().optional()),
});

export type AddActivityFormValues = z.input<typeof addActivitySchema>;
