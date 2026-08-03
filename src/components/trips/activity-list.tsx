"use client"

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, MapPin, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { type KeyboardEvent, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { reorderActivity } from "@/lib/actions/activities"
import { Card, CardContent } from "@/components/ui/card"
import { ActivityNoteDialog } from "@/components/trips/activity-note-dialog"
import { ActivityActionsMenu } from "@/components/trips/activity-actions-menu"
import { TransportFormDialog } from "@/components/trips/transport-form-dialog"
import { TransportActionsMenu } from "@/components/trips/transport-actions-menu"
import { getTransportIcon } from "@/lib/transport-modes"
import {
  computeDayTimeline,
  type ActivityTimeline,
  type TimelineSlot,
} from "@/lib/timeline"
import { applyReorder, type CachedActivity, type CachedDay } from "@/lib/itinerary-cache"
import { itineraryQueryKey } from "@/lib/queries/itinerary"

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
  const queryClient = useQueryClient()
  const queryKey = itineraryQueryKey(tripId)

  // Rule: 成員拖曳後行程順序更新（樂觀更新，失敗時回滾）
  // 其他團員的異動也會透過 useItineraryRealtime 局部更新同一份 cache，故不需另外 invalidate
  // onMutate 先「假裝成功」讓畫面立即更新，mutationFn 才是真正打 API；如果 mutationFn 失敗，onError 就用 onMutate 存的 previous 把 cache 復原
  // setQueryData 負責「寫入 cache」，applyReorder 負責「算出寫入的內容」——把 server 端 reorderActivity 的排序邏輯在前端本地重算一次，讓拖曳當下畫面就先更新，之後才等 server 真正確認
  const reorderMutation = useMutation({
    mutationFn: async ({
      activityId,
      targetOrder,
    }: {
      activityId: number
      targetOrder: number
    }) => {
      const formData = new FormData()
      formData.set("activity_id", String(activityId))
      formData.set("target_order", String(targetOrder))

      const result = await reorderActivity({}, formData)
      if (result.error) throw new Error(result.error)
    },
    onMutate: async ({ activityId, targetOrder }) => {
      await queryClient.cancelQueries({ queryKey }) //避免正在進行的 refetch 蓋掉樂觀更新
      const previous = queryClient.getQueryData<CachedDay[]>(queryKey) //目前 cache 的快照
      queryClient.setQueryData<CachedDay[]>(queryKey, (days) => //寫入 cache
        days ? applyReorder(days, dayId, activityId, targetOrder) : days, //applyReorder純函式，接收目前的 CachedDay[] 快照，算出「拖曳後應該長什麼樣子」的新版本
      )
      return { previous }
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous)
      toast.error(error instanceof Error ? error.message : "調整行程順序失敗")
    },
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    //active 是被拖曳的項目，over 是放開時所在位置的項目
    const { active, over } = event
    if (!over || active.id === over.id) return

    const toIndex = activities.findIndex((a) => a.id === over.id)
    if (toIndex === -1) return

    reorderMutation.mutate({
      activityId: Number(active.id),
      targetOrder: toIndex + 1,
    })
  }

  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
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
    <DndContext
      id={`activity-list-${dayId}`}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={activities.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul>
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
    </DndContext>
  )
}

// 時間軸左側的時間標籤；跨過午夜時於時間下方標示隔天日期；時間衝突時標示警告圖示
function TimelineLabel({
  slot,
  dayDate,
  hasConflict,
}: {
  slot: TimelineSlot | null
  dayDate: string
  hasConflict?: boolean
}) {
  return (
    <div className="flex w-11 shrink-0 flex-col items-end text-right">
      {slot && (
        <>
          <span className="flex items-center gap-1 text-xs font-medium tabular-nums">
            {hasConflict && (
              <TriangleAlert
                className="size-3 text-destructive"
                aria-label="時間衝突"
              />
            )}
            {slot.time}
          </span>
          {slot.date !== dayDate && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {formatShortDate(slot.date)}
            </span>
          )}
        </>
      )}
    </div>
  )
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-")
  return `${Number(month)}/${Number(day)}`
}

// Rule: 前面行程累加時間早於指定時間時，中間顯示空閒時間
function formatIdleDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours} 小時 ${mins} 分鐘`
}

function SortableActivityItem({
  tripId,
  activity,
  index,
  timeline,
  dayDate,
  isLast,
}: {
  tripId: number
  activity: CachedActivity
  index: number
  timeline: ActivityTimeline
  dayDate: string
  isLast: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id })
  const [noteOpen, setNoteOpen] = useState(false)

  // 只在按鍵事件「直接」發生在整個行程卡片本身時才開啟備註彈窗；
  // 若是從內部的拖曳把手／連結／編輯／刪除按鈕冒泡上來（例如用鍵盤拖曳時按 Space），則忽略，避免互相搶按鍵
  function handleNoteKeyDown(event: KeyboardEvent) {
    if (event.target !== event.currentTarget) return
    if (event.key !== "Enter" && event.key !== " ") return
    event.preventDefault()
    setNoteOpen(true)
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-50" : undefined}
    >
      {timeline.idleMinutesBefore !== null && (
        <div className="flex gap-3">
          <div className="w-11 shrink-0" />
          <div className="flex w-5 shrink-0 flex-col items-center self-stretch">
            <span className="w-px flex-1 bg-[repeating-linear-gradient(to_bottom,currentColor_0,currentColor_4px,transparent_4px,transparent_8px)] text-border" />
          </div>
          <p className="flex-1 pb-2 text-xs text-muted-foreground">
            空閒 {formatIdleDuration(timeline.idleMinutesBefore)}
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <TimelineLabel
          slot={timeline.activity}
          dayDate={dayDate}
          hasConflict={timeline.hasConflict}
        />
        <div className="flex w-5 shrink-0 flex-col items-center self-stretch">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {index + 1}
          </span>
          <span className="w-px flex-1 bg-border" />
        </div>
        <div className="min-w-0 flex-1 pb-2">
          <Card
            size="sm"
            role="button"
            tabIndex={0}
            className="cursor-pointer transition-colors hover:bg-accent/50"
            onClick={() => setNoteOpen(true)}
            onKeyDown={handleNoteKeyDown}
          >
            <CardContent className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-start gap-2">
                <button
                  type="button"
                  aria-label="拖曳以調整順序"
                  className="mt-1 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
                  onClick={(e) => e.stopPropagation()}
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="size-4" />
                </button>
                <div className="min-w-0 space-y-1">
                  {activity.google_map_url ? (
                    <a
                      href={activity.google_map_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex wrap-break-word gap-1 font-medium text-primary hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MapPin className="size-3.5 mt-[2px]" />
                      {activity.name}
                    </a>
                  ) : (
                    <p className="wrap-break-word font-medium">{activity.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    停留 {activity.duration_minutes} 分鐘
                  </p>
                </div>
              </div>
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <ActivityActionsMenu tripId={tripId} activity={activity} />
              </div>
            </CardContent>
          </Card>
          {/* 刻意放在 Card 外面：DialogContent 是透過 portal 掛載，React 的合成事件仍會沿著元件樹往上冒泡，
              放在 Card 內部會導致點擊彈窗的關閉按鈕時，事件也會冒泡觸發 Card 的 onClick 而重新打開彈窗 */}
          <ActivityNoteDialog
            activity={activity}
            open={noteOpen}
            onOpenChange={setNoteOpen}
          />
        </div>
      </div>

      <div className="flex gap-3">
        <TimelineLabel slot={timeline.transport} dayDate={dayDate} />
        <div className="flex w-5 shrink-0 flex-col items-center self-stretch">
          {timeline.transport && (
            <>
              <span className="h-1 w-px bg-border" />
              <span className="size-2 shrink-0 rounded-full bg-primary" />
            </>
          )}
          {!isLast && <span className="w-px flex-1 bg-border" />}
        </div>
        <div className="flex flex-1 items-center gap-2 pb-2 text-xs text-muted-foreground">
          {activity.transport ? (
            <>
              <span>
                {getTransportIcon(
                  activity.transport.mode,
                  activity.transport.icon,
                )}{" "}
                · {activity.transport.hours} 時 {activity.transport.minutes} 分
              </span>
              <TransportActionsMenu
                activityId={activity.id}
                transport={activity.transport}
              />
            </>
          ) : (
            <TransportFormDialog
              mode="create"
              tripId={activity.trip_id}
              activityId={activity.id}
            />
          )}
        </div>
      </div>
    </li>
  )
}
