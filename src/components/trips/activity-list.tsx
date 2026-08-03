"use client"

import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { SortableActivityItem } from "@/components/trips/sortable-activity-item"
import { computeDayTimeline } from "@/lib/timeline"
import { dayDropId, type CachedActivity } from "@/lib/itinerary-cache"
import { cn } from "@/lib/utils"

export function ActivityList({
  tripId,
  dayId,
  dayDate,
  startTime,
  activities,
}: {
  tripId: number
  dayId: number
  dayDate: string
  startTime: string | null
  activities: CachedActivity[]
}) {
  // Rule: 行程可跨天搬移——DndContext/onDragEnd 提升到 ItineraryBoard 統一處理，
  // 這裡只負責把整個列表容器註冊成 drop target，讓拖到別天的空白處也能放下
  const { setNodeRef, isOver } = useDroppable({ id: dayDropId(dayId) })

  if (activities.length === 0) {
    return (
      <div
        ref={setNodeRef}
        className={cn(
          "rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground transition-colors",
          isOver && "border-primary bg-primary/5",
        )}
      >
        這天還沒有行程
      </div>
    )
  }

  // Feature: 行程時間軸（spec/features/行程時間軸.feature）
  // 依當日開始時間、停留時間與交通時間計算；activities 改變時（拖曳、他人異動）時間軸跟著重新計算
  const timelines = computeDayTimeline(
    { date: dayDate, start_time: startTime },
    activities,
  )

  return (
    <SortableContext
      items={activities.map((a) => a.id)}
      strategy={verticalListSortingStrategy}
    >
      <ul
        ref={setNodeRef}
        className={cn(
          "rounded-xl transition-colors",
          isOver && "outline outline-2 outline-primary outline-offset-4",
        )}
      >
        {activities.map((activity, index) => (
          <SortableActivityItem
            key={activity.id}
            tripId={tripId}
            activity={activity}
            index={index}
            timeline={timelines[index]}
            dayDate={dayDate}
            isLast={index === activities.length - 1}
          />
        ))}
      </ul>
    </SortableContext>
  )
}
