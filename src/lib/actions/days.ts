"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { setDayStartTimeSchema } from "@/lib/validations/days";

export type SetDayStartTimeState = {
  error?: string;
  success?: boolean;
};

/**
 * Feature: 設定當日開始時間
 * 對應規格：spec/features/設定當日開始時間.feature
 */
export async function setDayStartTime(
  _prevState: SetDayStartTimeState,
  formData: FormData,
): Promise<SetDayStartTimeState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const parsed = setDayStartTimeSchema.safeParse({
    day_id: formData.get("day_id"),
    start_time: formData.get("start_time"),
  });

  // Rule: 已設定的開始時間不可清空為未設定
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "設定開始時間失敗" };
  }

  const { day_id, start_time } = parsed.data;

  const day = await prisma.day.findUniqueOrThrow({ where: { id: day_id } });

  const membership = await prisma.tripMember.findUnique({
    where: { trip_id_user_id: { trip_id: day.trip_id, user_id: user.id } },
  });

  // Rule: 使用者必須是旅程成員
  if (!membership) {
    return { error: "你不是此旅程的成員" };
  }

  // Rule: 成員可以設定當日的開始時間
  await prisma.day.update({
    where: { id: day_id },
    data: { start_time },
  });

  revalidatePath(`/trips/${day.trip_id}`);
  return { success: true };
}
