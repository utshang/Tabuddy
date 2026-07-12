"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import {
  addActivitySchema,
  editActivitySchema,
  reorderActivitySchema,
} from "@/lib/validations/activities";
import { computeReorder } from "@/lib/reorder";

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

export type EditActivityState = {
  error?: string;
  success?: boolean;
};

export async function editActivity(
  _prevState: EditActivityState,
  formData: FormData,
): Promise<EditActivityState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const activityId = Number(formData.get("activity_id"));

  const parsed = editActivitySchema.safeParse({
    name: formData.get("name"),
    google_map_url: formData.get("google_map_url"),
    duration_minutes: formData.get("duration_minutes"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "編輯行程失敗" };
  }

  const { name, google_map_url, duration_minutes, note } = parsed.data;

  const activity = await prisma.activity.findUniqueOrThrow({
    where: { id: activityId },
    include: { day: true },
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

  // Rule: 成員可以編輯行程的名稱
  // Rule: 成員可以編輯行程的 GoogleMap 連結
  // Rule: 成員可以編輯行程的停留時間
  // Rule: 成員可以編輯行程的備註
  // Rule: 編輯行程可同時修改任意欄位組合
  await prisma.activity.update({
    where: { id: activityId },
    data: {
      name,
      google_map_url: google_map_url ?? null,
      duration_minutes,
      note: note ?? null,
    },
  });

  revalidatePath(`/trips/${activity.day.trip_id}`);
  return { success: true };
}

export type DeleteActivityState = {
  error?: string;
  success?: boolean;
};

export async function deleteActivity(
  _prevState: DeleteActivityState,
  formData: FormData,
): Promise<DeleteActivityState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const activityId = Number(formData.get("activity_id"));
  const confirmDeletion = formData.get("confirm_deletion") === "true";

  const activity = await prisma.activity.findUniqueOrThrow({
    where: { id: activityId },
    include: { day: true },
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

  // Rule: 刪除行程需經使用者確認才會執行
  if (!confirmDeletion) {
    return { error: "請先確認刪除" };
  }

  await prisma.$transaction(async (tx) => {
    // Rule: 成員可以刪除行程
    // Rule: 刪除行程後接續的交通時間一併刪除
    // （由資料庫層級的 ON DELETE CASCADE 外鍵約束保證）
    await tx.activity.delete({ where: { id: activityId } });

    // Rule: 刪除行程後同一天其餘行程順序重新編號
    const remaining = await tx.activity.findMany({
      where: { day_id: activity.day_id },
      orderBy: { order: "asc" },
    });

    await Promise.all(
      remaining.map((a, index) =>
        tx.activity.update({
          where: { id: a.id },
          data: { order: index + 1 },
        }),
      ),
    );
  });

  revalidatePath(`/trips/${activity.day.trip_id}`);
  return { success: true };
}

export type ReorderActivityState = {
  error?: string;
  success?: boolean;
};

export async function reorderActivity(
  _prevState: ReorderActivityState,
  formData: FormData,
): Promise<ReorderActivityState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const parsed = reorderActivitySchema.safeParse({
    activity_id: formData.get("activity_id"),
    target_order: formData.get("target_order"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "調整行程順序失敗" };
  }

  const { activity_id, target_order } = parsed.data;

  const activity = await prisma.activity.findUniqueOrThrow({
    where: { id: activity_id },
    include: { day: true },
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

  const dayActivities = await prisma.activity.findMany({
    where: { day_id: activity.day_id },
    include: { transport: true },
  });

  const reorderResult = computeReorder(
    dayActivities.map((a) => ({
      id: a.id,
      order: a.order,
      transportId: a.transport?.id ?? null,
    })),
    activity_id,
    target_order,
  );

  // Rule: 目標順序超出有效範圍時操作失敗
  if (!reorderResult) {
    return { error: "目標順序超出有效範圍" };
  }

  await prisma.$transaction(async (tx) => {
    // Rule: 成員拖曳後行程順序更新
    await Promise.all(
      reorderResult.activityOrders.map(({ activityId, newOrder }) =>
        tx.activity.update({
          where: { id: activityId },
          data: { order: newOrder },
        }),
      ),
    );

    // Rule: 交通時間依附於順序位置，不隨行程本體移動
    await Promise.all(
      reorderResult.transportReassignments.map(
        ({ transportId, newAfterActivityId }) =>
          tx.transport.update({
            where: { id: transportId },
            data: { after_activity_id: newAfterActivityId },
          }),
      ),
    );
  });

  revalidatePath(`/trips/${activity.day.trip_id}`);
  return { success: true };
}
