"use client"

import {
  DndContext,
  type CollisionDetection,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { DayTabsNav } from "@/components/trips/day-tabs-nav"
import { ActivityFormDialog } from "@/components/trips/activity-form-dialog"
import { ActivityList } from "@/components/trips/activity-list"
import { DayStartTimeDialog } from "@/components/trips/day-start-time-dialog"
import { useItineraryRealtime } from "@/hooks/use-itinerary-realtime"
import { fetchItinerary, itineraryQueryKey } from "@/lib/queries/itinerary"
import { moveActivityToDay, reorderActivity } from "@/lib/actions/activities"
import {
  applyCrossDayMove,
  applyReorder,
  parseDayDropId,
  type CachedDay,
} from "@/lib/itinerary-cache"

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"]

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number)
  const weekday = WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()]
  return `${month}/${day}(${weekday})`
}

// Rule: 行程可跨天搬移
// 每天的行程列表容器（day-drop-{dayId}）本身也是 droppable，跟容器裡每張行程卡片
// （id 為數字）的可放置範圍互相重疊。closestCenter 是用容器/卡片各自的「整個矩形中心點」
// 去跟拖曳中項目的中心點比距離，天數少、卡片少時容器中心點可能反而比游標懸停的那張卡片
// 更近，導致 over 誤判成容器（＝視為放到該天最後），而非游標實際懸停的卡片。
// 改用 pointerWithin：游標懸停在哪張卡片上就命中哪張卡片，只有懸停在卡片以外的空白處
// （例如空狀態的天）才會命中容器本身。
const collisionDetectionStrategy: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args)
  const activityCollision = pointerCollisions.find(
    (collision) => typeof collision.id === "number",
  )
  if (activityCollision) return [activityCollision]
  if (pointerCollisions.length > 0) return pointerCollisions
  return closestCenter(args)
}

/**
 * Feature: 行程即時同步
 * 對應規格：各 spec/features/*.feature 內「其他團員異動後，正在查看行程的使用者即時看到更新」規則
 *
 * 取代原本直接吃 Server Component props 的靜態行程區塊：改由 TanStack Query 持有行程資料
 * （以 Server Component 撈到的資料當 initialData），並用 useItineraryRealtime 訂閱異動、
 * 局部更新 cache，讓所有正在查看的成員即時看到彼此的變更。
 */
export function ItineraryBoard({
  tripId,
  initialDays,
}: {
  tripId: number
  initialDays: CachedDay[]
}) {
  useItineraryRealtime(tripId)

  const queryClient = useQueryClient()
  const queryKey = itineraryQueryKey(tripId)

  const { data: days } = useQuery({
    queryKey,
    queryFn: () => fetchItinerary(tripId),
    initialData: initialDays,
  })

  // Rule: 成員拖曳後行程順序更新（同一天內，樂觀更新，失敗時回滾）
  // 其他團員的異動也會透過 useItineraryRealtime 局部更新同一份 cache，故不需另外 invalidate
  const reorderMutation = useMutation({
    mutationFn: async ({
      activityId,
      targetOrder,
    }: {
      dayId: number
      activityId: number
      targetOrder: number
    }) => {
      const formData = new FormData()
      formData.set("activity_id", String(activityId))
      formData.set("target_order", String(targetOrder))

      const result = await reorderActivity({}, formData)
      if (result.error) throw new Error(result.error)
    },
    onMutate: async ({ dayId, activityId, targetOrder }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CachedDay[]>(queryKey)
      queryClient.setQueryData<CachedDay[]>(queryKey, (current) =>
        current ? applyReorder(current, dayId, activityId, targetOrder) : current,
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
      toast.error(error instanceof Error ? error.message : "調整行程順序失敗")
    },
  })

  // Rule: 行程可跨天搬移（樂觀更新，失敗時回滾）
  // Rule: 跨天搬移時，搬移行程前後的交通時間一併移除
  const crossDayMoveMutation = useMutation({
    mutationFn: async ({
      activityId,
      targetDayId,
      targetOrder,
    }: {
      sourceDayId: number
      activityId: number
      targetDayId: number
      targetOrder: number
    }) => {
      const formData = new FormData()
      formData.set("activity_id", String(activityId))
      formData.set("target_day_id", String(targetDayId))
      formData.set("target_order", String(targetOrder))

      const result = await moveActivityToDay({}, formData)
      if (result.error) throw new Error(result.error)
    },
    onMutate: async ({ sourceDayId, activityId, targetDayId, targetOrder }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData<CachedDay[]>(queryKey)
      queryClient.setQueryData<CachedDay[]>(queryKey, (current) => {
        if (!current) return current
        const { days: next, removedTransportIds } = applyCrossDayMove(
          current,
          sourceDayId,
          targetDayId,
          activityId,
          targetOrder,
        )
        if (removedTransportIds.length > 0) {
          toast.info("交通時間已移除，請重新設定")
        }
        return next
      })
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
      toast.error(error instanceof Error ? error.message : "搬移行程失敗")
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Rule: 行程可跨天搬移
  // 單一 DndContext 涵蓋所有天，才能把 active 從一天的 SortableContext 拖到另一天；
  // over 若對應到某個行程 → 插在該行程之前；若對應到某天的容器 id（空白處/空狀態）→ 放在該天最後
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activityId = Number(active.id)
    const sourceDay = days.find((day) =>
      day.activities.some((a) => a.id === activityId),
    )
    if (!sourceDay) return

    const overDayId = parseDayDropId(over.id)
    const targetDay = overDayId !== null
      ? days.find((day) => day.id === overDayId)
      : days.find((day) => day.activities.some((a) => a.id === Number(over.id)))
    if (!targetDay) return

    const targetIndex = overDayId !== null
      ? targetDay.activities.length
      : targetDay.activities.findIndex((a) => a.id === Number(over.id))
    if (targetIndex === -1) return

    if (sourceDay.id === targetDay.id) {
      reorderMutation.mutate({
        dayId: sourceDay.id,
        activityId,
        targetOrder: targetIndex + 1,
      })
    } else {
      crossDayMoveMutation.mutate({
        sourceDayId: sourceDay.id,
        activityId,
        targetDayId: targetDay.id,
        targetOrder: targetIndex + 1,
      })
    }
  }

  const dayTabs = days.map((day) => ({
    id: day.id,
    dayLabel: `第 ${day.order} 天`,
    dateLabel: formatDate(day.date),
  }))

  return (
    <div className="space-y-6">
      <DayTabsNav days={dayTabs} />

      <DndContext
        id="itinerary-board"
        sensors={sensors}
        collisionDetection={collisionDetectionStrategy}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-8">
          {days.map((day) => (
            <section
              key={day.id}
              id={`day-${day.id}`}
              className="scroll-mt-[var(--sticky-offset,80px)] space-y-3"
            >
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-lg font-semibold">
                    第 {day.order} 天 · {formatDate(day.date)}
                  </h2>
                  <DayStartTimeDialog dayId={day.id} startTime={day.start_time} />
                </div>
                <ActivityFormDialog mode="create" tripId={tripId} dayId={day.id} />
              </div>

              <ActivityList
                tripId={tripId}
                dayId={day.id}
                dayDate={day.date}
                startTime={day.start_time}
                activities={day.activities}
              />
            </section>
          ))}
        </div>
      </DndContext>
    </div>
  )
}