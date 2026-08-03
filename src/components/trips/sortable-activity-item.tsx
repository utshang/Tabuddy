"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, MapPin } from "lucide-react"
import { type KeyboardEvent, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ActivityNoteDialog } from "@/components/trips/activity-note-dialog"
import { ActivityActionsMenu } from "@/components/trips/activity-actions-menu"
import { TransportFormDialog } from "@/components/trips/transport-form-dialog"
import { TransportActionsMenu } from "@/components/trips/transport-actions-menu"
import { TimelineLabel } from "@/components/trips/timeline-label"
import { getTransportIcon } from "@/lib/transport-modes"
import type { ActivityTimeline } from "@/lib/timeline"
import type { CachedActivity } from "@/lib/itinerary-cache"

// Rule: 前面行程累加時間早於指定時間時，中間顯示空閒時間
function formatIdleDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours} 小時 ${mins} 分鐘`
}

export function SortableActivityItem({
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
