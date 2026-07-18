import { z } from "zod";

// Feature: 設定當日開始時間
export const setDayStartTimeSchema = z.object({
  day_id: z.coerce.number().int(),
  // Rule: 已設定的開始時間不可清空為未設定
  start_time: z.string().trim().min(1, "開始時間為必填"),
});

export type SetDayStartTimeFormValues = z.input<typeof setDayStartTimeSchema>;
