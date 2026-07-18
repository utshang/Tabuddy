"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MapPin } from "lucide-react";
import { toast } from "sonner";
import { reorderActivity } from "@/lib/actions/activities";
import { Card, CardContent } from "@/components/ui/card";
import { EditActivityDialog } from "@/components/trips/edit-activity-dialog";
import { DeleteActivityDialog } from "@/components/trips/delete-activity-dialog";
import { AddTransportDialog } from "@/components/trips/add-transport-dialog";
import { TransportActionsMenu } from "@/components/trips/transport-actions-menu";
import { getTransportIcon } from "@/lib/transport-modes";
import {
  computeDayTimeline,
  type ActivityTimeline,
  type TimelineSlot,
} from "@/lib/timeline";

type Transport = {
  hours: number;
  minutes: number;
  mode: string;
  icon: string | null;
};

type Activity = {
  id: number;
  name: string;
  google_map_url: string | null;
  duration_minutes: number;
  note: string | null;
  order: number;
  transport?: Transport | null;
};

export function ActivityList({
  dayId,
  dayDate,
  startTime,
  activities,
}: {
  dayId: number;
  dayDate: string;
  startTime: string | null;
  activities: Activity[];
}) {
  const [items, setItems] = useState(activities);
  // 伺服器重新驗證送來新的 activities 時（例如其他成員的異動），同步回本地狀態
  const [syncedActivities, setSyncedActivities] = useState(activities);
  if (activities !== syncedActivities) {
    setSyncedActivities(activities);
    setItems(activities);
  }
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    //active 是被拖曳的項目，over 是放開時所在位置的項目
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const fromIndex = items.findIndex((a) => a.id === active.id);
    const toIndex = items.findIndex((a) => a.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;

    const previousItems = items;
    //把陣列中的元素從 fromIndex 移到 toIndex，回傳新陣列（不改動原陣列）
    const nextItems = arrayMove(items, fromIndex, toIndex);
    setItems(nextItems);

    // Rule: 成員拖曳後行程順序更新（樂觀更新，失敗時回滾）
    startTransition(async () => {
      const formData = new FormData();
      formData.set("activity_id", String(active.id));
      formData.set("target_order", String(toIndex + 1));

      const result = await reorderActivity({}, formData);

      if (result.error) {
        setItems(previousItems);
        toast.error(result.error);
      }
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
        這天還沒有行程
      </div>
    );
  }

  // Feature: 行程時間軸（spec/features/行程時間軸.feature）
  // 依當日開始時間、停留時間與交通時間計算；拖曳行程後 items 改變，時間軸跟著重新計算
  const timelines = computeDayTimeline(
    { date: dayDate, start_time: startTime },
    items,
  );

  return (
    <DndContext
      id={`activity-list-${dayId}`}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((a) => a.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul>
          {items.map((activity, index) => (
            <SortableActivityItem
              key={activity.id}
              activity={activity}
              index={index}
              timeline={timelines[index]}
              dayDate={dayDate}
              isLast={index === items.length - 1}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

// 時間軸左側的時間標籤；跨過午夜時於時間下方標示隔天日期
function TimelineLabel({
  slot,
  dayDate,
}: {
  slot: TimelineSlot | null;
  dayDate: string;
}) {
  return (
    <div className="flex w-11 shrink-0 flex-col items-end text-right">
      {slot && (
        <>
          <span className="text-xs font-medium tabular-nums">{slot.time}</span>
          {slot.date !== dayDate && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {formatShortDate(slot.date)}
            </span>
          )}
        </>
      )}
    </div>
  );
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

function SortableActivityItem({
  activity,
  index,
  timeline,
  dayDate,
  isLast,
}: {
  activity: Activity;
  index: number;
  timeline: ActivityTimeline;
  dayDate: string;
  isLast: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-50" : undefined}
    >
      <div className="flex gap-3">
        <TimelineLabel slot={timeline.activity} dayDate={dayDate} />
        <div className="flex w-5 shrink-0 flex-col items-center self-stretch">
          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
            {index + 1}
          </span>
          <span className="w-px flex-1 bg-border" />
        </div>
        <div className="min-w-0 flex-1 pb-2">
          <Card size="sm">
            <CardContent className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <button
                  type="button"
                  aria-label="拖曳以調整順序"
                  className="mt-1 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="size-4" />
                </button>
                <div className="space-y-1">
                  {activity.google_map_url ? (
                    <a
                      href={activity.google_map_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                    >
                      <MapPin className="size-3.5" />
                      {activity.name}
                    </a>
                  ) : (
                    <p className="font-medium">{activity.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    停留 {activity.duration_minutes} 分鐘
                  </p>
                  {activity.note && (
                    <p className="text-xs text-muted-foreground">
                      {activity.note}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <EditActivityDialog activity={activity} />
                <DeleteActivityDialog activity={activity} />
              </div>
            </CardContent>
          </Card>
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
            <AddTransportDialog activityId={activity.id} />
          )}
        </div>
      </div>
    </li>
  );
}
