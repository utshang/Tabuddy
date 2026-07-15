"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  addTransportSchema,
  editTransportSchema,
} from "@/lib/validations/transports";
import { resolveEditedTransportIcon } from "@/lib/transport-modes";

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

export type EditTransportState = {
  error?: string;
  success?: boolean;
};

/**
 * Feature: 編輯交通時間
 * 對應規格：spec/features/編輯交通時間.feature
 */
export async function editTransport(
  _prevState: EditTransportState,
  formData: FormData,
): Promise<EditTransportState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const parsed = editTransportSchema.safeParse({
    after_activity_id: formData.get("after_activity_id"),
    hours: formData.get("hours"),
    minutes: formData.get("minutes"),
    mode: formData.get("mode"),
    icon: formData.get("icon"),
  });

  // Rule: 編輯後的時必須 >= 0
  // Rule: 編輯後的分必須 >= 0 且 < 60
  // Rule: 編輯後的交通工具為必填
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "編輯交通時間失敗" };
  }

  const { after_activity_id, hours, minutes, mode, icon } = parsed.data;

  const transport = await prisma.transport.findUniqueOrThrow({
    where: { after_activity_id },
    include: { after_activity: { include: { day: true } } },
  });

  const tripId = transport.after_activity.day.trip_id;

  const membership = await prisma.tripMember.findUnique({
    where: { trip_id_user_id: { trip_id: tripId, user_id: user.id } },
  });

  // Rule: 使用者必須是旅程成員
  if (!membership) {
    return { error: "你不是此旅程的成員" };
  }

  // Rule: 自訂交通工具的名稱與圖示皆可編輯
  // Rule: 交通工具改為預設選項時圖示自動清除
  const resolvedIcon = resolveEditedTransportIcon({
    nextMode: mode,
    submittedIcon: icon ?? null,
  });

  // Rule: 成員可以編輯交通時間的時
  // Rule: 成員可以編輯交通時間的分
  // Rule: 成員可以編輯交通時間的交通工具
  // Rule: 編輯交通時間可同時修改任意欄位組合
  await prisma.transport.update({
    where: { id: transport.id },
    data: { hours, minutes, mode, icon: resolvedIcon },
  });

  revalidatePath(`/trips/${tripId}`);
  return { success: true };
}
