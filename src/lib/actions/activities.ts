"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { addActivitySchema } from "@/lib/validations/activities";
import { log } from "console";

export type AddActivityState = {
  error?: string;
  success?: boolean;
};

export async function addActivity(
  _prevState: AddActivityState,
  formData: FormData,
): Promise<AddActivityState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const parsed = addActivitySchema.safeParse({
    day_id: formData.get("day_id"),
    name: formData.get("name"),
    google_map_url: formData.get("google_map_url"),
    duration_minutes: formData.get("duration_minutes"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "新增行程失敗" };
  }

  const { day_id, name, google_map_url, duration_minutes, note } = parsed.data;

  const day = await prisma.day.findUniqueOrThrow({ where: { id: day_id } });

  const membership = await prisma.tripMember.findUnique({
    where: { trip_id_user_id: { trip_id: day.trip_id, user_id: user.id } },
  });

  // Rule: 使用者必須是旅程成員
  if (!membership) {
    return { error: "你不是此旅程的成員" };
  }

  await prisma.$transaction(async (tx) => {
    // Rule: 新增的行程固定加入當天行程順序的最後
    const activityCount = await tx.activity.count({ where: { day_id } });

    // Rule: 成功新增後行程出現在對應旅程日期中
    // Rule: 新增行程時可一併填寫選填資訊
    await tx.activity.create({
      data: {
        day_id,
        name,
        google_map_url,
        duration_minutes,
        note,
        order: activityCount + 1,
      },
    });
  });

  revalidatePath(`/trips/${day.trip_id}`);
  return { success: true };
}
