/**
 * Feature: 新增行程 / 編輯行程 / 刪除行程 / 調整行程順序 / 新增交通時間 / 編輯交通時間 / 刪除交通時間
 * 對應規格：各 spec/features/*.feature 內「其他團員異動後，正在查看行程的使用者即時看到更新」規則
 *
 * Supabase Realtime 的 postgres_changes 事件與 useMutation 的樂觀更新，
 * 都透過這裡的純函式對 TanStack Query 的 itinerary cache 做局部更新（而非整包 invalidate 重抓）。
 * days/activities/transports 三張表的事件互相獨立送達，activities 的事件不含 join 出來的
 * transport，因此更新 activity 時必須保留原本 cache 裡的 transport，不能整包覆蓋。
 */
import { computeCrossDayMove, computeReorder } from "@/lib/reorder";

export type CachedTransport = {
  id: number;
  after_activity_id: number;
  trip_id: number;
  hours: number;
  minutes: number;
  mode: string;
  icon: string | null;
};

export type CachedActivity = {
  id: number;
  day_id: number;
  trip_id: number;
  name: string;
  google_map_url: string | null;
  duration_minutes: number;
  note: string | null;
  order: number;
  fixed_time: string | null;
  transport: CachedTransport | null;
};

export type CachedDay = {
  id: number;
  trip_id: number;
  date: string;
  start_time: string | null;
  order: number;
  activities: CachedActivity[];
};

export type ItineraryEventType = "INSERT" | "UPDATE" | "DELETE";

// Feature: 調整行程順序（Rule: 行程可跨天搬移）
// dnd-kit 的 DndContext 在 ItineraryBoard 統一管理，每天的行程列表容器（含空狀態）
// 都用這個 id 註冊成 droppable，讓拖到別天的空白處也能被辨識為該天的容器
const DAY_DROP_PREFIX = "day-drop-";

export function dayDropId(dayId: number): string {
  return `${DAY_DROP_PREFIX}${dayId}`;
}

export function parseDayDropId(id: string | number): number | null {
  if (typeof id !== "string" || !id.startsWith(DAY_DROP_PREFIX)) return null;
  const dayId = Number(id.slice(DAY_DROP_PREFIX.length));
  return Number.isNaN(dayId) ? null : dayId;
}

export type DayRow = Omit<CachedDay, "activities">;
export type ActivityRow = Omit<CachedActivity, "transport">;
export type TransportRow = CachedTransport;

function sortByOrder<T extends { order: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}

export function applyDayEvent(
  days: CachedDay[],
  eventType: ItineraryEventType,
  row: DayRow,
): CachedDay[] {
  if (eventType === "DELETE") {
    return days.filter((day) => day.id !== row.id);
  }

  const existing = days.find((day) => day.id === row.id);
  const merged: CachedDay = { ...row, activities: existing?.activities ?? [] };

  const next = existing
    ? days.map((day) => (day.id === row.id ? merged : day))
    : [...days, merged];

  return sortByOrder(next);
}

export function applyActivityEvent(
  days: CachedDay[],
  eventType: ItineraryEventType,
  row: ActivityRow,
): CachedDay[] {
  if (eventType === "DELETE") {
    return days.map((day) =>
      day.id === row.day_id
        ? { ...day, activities: day.activities.filter((a) => a.id !== row.id) }
        : day,
    );
  }

  // Rule: 行程可跨天搬移，day_id 不再保證固定；先找出行程目前（可能在別天）的
  // transport 與所在天，再從所有天移除舊資料，最後插入 row.day_id 對應的天
  const existing = days
    .flatMap((day) => day.activities)
    .find((a) => a.id === row.id);
  const merged: CachedActivity = { ...row, transport: existing?.transport ?? null };

  return days.map((day) => {
    const withoutExisting = existing
      ? day.activities.filter((a) => a.id !== row.id)
      : day.activities;

    if (day.id !== row.day_id) {
      return withoutExisting === day.activities
        ? day
        : { ...day, activities: withoutExisting };
    }

    return { ...day, activities: sortByOrder([...withoutExisting, merged]) };
  });
}

function removeTransportById(days: CachedDay[], transportId: number): CachedDay[] {
  return days.map((day) => ({
    ...day,
    activities: day.activities.map((activity) =>
      activity.transport?.id === transportId
        ? { ...activity, transport: null }
        : activity,
    ),
  }));
}

export function applyTransportEvent(
  days: CachedDay[],
  eventType: ItineraryEventType,
  row: TransportRow,
): CachedDay[] {
  if (eventType === "DELETE") {
    return removeTransportById(days, row.id);
  }

  // Rule: 拖曳調整順序時 after_activity_id 會重新指向排在該順序位置的行程，
  // 先移除舊的掛載位置，再依目前的 after_activity_id 掛回正確的行程
  const withoutOldOwner = removeTransportById(days, row.id);

  return withoutOldOwner.map((day) => ({
    ...day,
    activities: day.activities.map((activity) =>
      activity.id === row.after_activity_id
        ? { ...activity, transport: row }
        : activity,
    ),
  }));
}

/**
 * Feature: 調整行程順序（樂觀更新用）
 * 對應規格：spec/features/調整行程順序.feature
 *
 * 拖曳當下用來立即更新 cache 的樂觀版本：套用 computeReorder 算出的新順序與交通時間重新指向，
 * 失敗時由呼叫端用 mutation 的快照回滾。
 */
export function applyReorder(
  days: CachedDay[],
  dayId: number,
  movedActivityId: number,
  targetOrder: number,
): CachedDay[] {
  return days.map((day) => {
    if (day.id !== dayId) return day;

    const result = computeReorder(
      day.activities.map((a) => ({
        id: a.id,
        order: a.order,
        transportId: a.transport?.id ?? null,
      })),
      movedActivityId,
      targetOrder,
    );
    if (!result) return day;

    const transportById = new Map(
      day.activities
        .filter((a) => a.transport !== null)
        .map((a) => [a.transport!.id, a.transport!]),
    );
    const newOrderById = new Map(result.activityOrders.map((o) => [o.activityId, o.newOrder]));
    const newOwnerActivityIdByTransportId = new Map(
      result.transportReassignments.map((r) => [r.newAfterActivityId, r.transportId]),
    );

    const activities = day.activities.map((activity) => {
      const transportId = newOwnerActivityIdByTransportId.get(activity.id);
      const transport =
        transportId !== undefined
          ? { ...transportById.get(transportId)!, after_activity_id: activity.id }
          : null;

      return {
        ...activity,
        order: newOrderById.get(activity.id) ?? activity.order,
        transport,
      };
    });

    return { ...day, activities: sortByOrder(activities) };
  });
}

/**
 * Feature: 調整行程順序（Rule: 行程可跨天搬移，樂觀更新用）
 * 對應規格：spec/features/調整行程順序.feature
 *
 * 拖曳當下用來立即更新 cache 的樂觀版本：套用 computeCrossDayMove 算出的來源天／
 * 目標天新順序，並清除搬移行程前後兩筆交通時間。失敗時由呼叫端用 mutation 的快照回滾。
 */
export function applyCrossDayMove(
  days: CachedDay[],
  sourceDayId: number,
  targetDayId: number,
  movedActivityId: number,
  targetOrder: number,
): { days: CachedDay[]; removedTransportIds: number[] } {
  const sourceDay = days.find((d) => d.id === sourceDayId);
  const targetDay = days.find((d) => d.id === targetDayId);
  const movedActivity = sourceDay?.activities.find((a) => a.id === movedActivityId);
  if (!sourceDay || !targetDay || !movedActivity) {
    return { days, removedTransportIds: [] };
  }

  const result = computeCrossDayMove(
    sourceDay.activities.map((a) => ({
      id: a.id,
      order: a.order,
      transportId: a.transport?.id ?? null,
    })),
    targetDay.activities.map((a) => ({
      id: a.id,
      order: a.order,
      transportId: a.transport?.id ?? null,
    })),
    movedActivityId,
    targetOrder,
  );
  if (!result) return { days, removedTransportIds: [] };

  const removedTransportIds = new Set(result.transportIdsToDelete);
  const newOrderBySourceId = new Map(result.sourceOrders.map((o) => [o.activityId, o.newOrder]));
  const newOrderByTargetId = new Map(result.targetOrders.map((o) => [o.activityId, o.newOrder]));

  const movedActivityInTargetDay: CachedActivity = {
    ...movedActivity,
    day_id: targetDayId,
    order: newOrderByTargetId.get(movedActivityId) ?? targetOrder,
    transport:
      movedActivity.transport && !removedTransportIds.has(movedActivity.transport.id)
        ? movedActivity.transport
        : null,
  };

  const nextDays = days.map((day) => {
    if (day.id === sourceDayId) {
      const activities = day.activities
        .filter((a) => a.id !== movedActivityId)
        .map((a) => ({
          ...a,
          order: newOrderBySourceId.get(a.id) ?? a.order,
          transport:
            a.transport && removedTransportIds.has(a.transport.id) ? null : a.transport,
        }));
      return { ...day, activities: sortByOrder(activities) };
    }

    if (day.id === targetDayId) {
      const activities = [
        ...day.activities.map((a) => ({
          ...a,
          order: newOrderByTargetId.get(a.id) ?? a.order,
        })),
        movedActivityInTargetDay,
      ];
      return { ...day, activities: sortByOrder(activities) };
    }

    return day;
  });

  return { days: nextDays, removedTransportIds: [...removedTransportIds] };
}
