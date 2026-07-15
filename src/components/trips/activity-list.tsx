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
  activities,
}: {
  dayId: number;
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
        <ul className="space-y-2">
          {items.map((activity) => (
            <SortableActivityItem key={activity.id} activity={activity} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableActivityItem({ activity }: { activity: Activity }) {
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
      className={isDragging ? "opacity-50 mb-0" : "mb-0"}
    >
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
                <p className="text-xs text-muted-foreground">{activity.note}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <EditActivityDialog activity={activity} />
            <DeleteActivityDialog activity={activity} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2 py-2 pl-8 text-xs text-muted-foreground">
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
    </li>
  );
}
