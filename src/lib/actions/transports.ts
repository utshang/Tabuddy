"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { addTransportSchema } from "@/lib/validations/transports";

export type AddTransportState = {
  error?: string;
  success?: boolean;
};

export async function addTransport(
  _prevState: AddTransportState,
  formData: FormData,
): Promise<AddTransportState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const parsed = addTransportSchema.safeParse({
    after_activity_id: formData.get("after_activity_id"),
    hours: formData.get("hours"),
    minutes: formData.get("minutes"),
    mode: formData.get("mode"),
    icon: formData.get("icon"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "新增交通時間失敗" };
  }

  const { after_activity_id, hours, minutes, mode, icon } = parsed.data;

  const activity = await prisma.activity.findUniqueOrThrow({
    where: { id: after_activity_id },
    include: { day: true, transport: true },
  });

  const membership = await prisma.tripMember.findUnique({
    where: {
      trip_id_user_id: { trip_id: activity.day.trip_id, user_id: user.id },
    },
  });

  // Rule: 使用者必須是旅程成員
  if (!membership) {
    return { error: "你不是此旅程的成員" };
  }

  // Rule: 行程已有交通時間時新增操作失敗
  if (activity.transport) {
    return { error: "此行程之後已有交通時間，請改用編輯" };
  }

  // Rule: 成功新增後交通時間出現在對應行程之後
  await prisma.transport.create({
    data: {
      after_activity_id,
      hours,
      minutes,
      mode,
      icon: icon ?? null,
    },
  });

  revalidatePath(`/trips/${activity.day.trip_id}`);
  return { success: true };
}
