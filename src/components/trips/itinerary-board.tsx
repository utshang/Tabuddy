"use client";

import { useQuery } from "@tanstack/react-query";
import { DayTabsNav } from "@/components/trips/day-tabs-nav";
import { AddActivityDialog } from "@/components/trips/add-activity-dialog";
import { ActivityList } from "@/components/trips/activity-list";
import { DayStartTimeDialog } from "@/components/trips/day-start-time-dialog";
import { useItineraryRealtime } from "@/hooks/use-itinerary-realtime";
import { fetchItinerary, itineraryQueryKey } from "@/lib/queries/itinerary";
import type { CachedDay } from "@/lib/itinerary-cache";

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const weekday = WEEKDAY_LABELS[new Date(year, month - 1, day).getDay()];
  return `${month}/${day}(${weekday})`;
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
  tripId: number;
  initialDays: CachedDay[];
}) {
  useItineraryRealtime(tripId);

  const { data: days } = useQuery({
    queryKey: itineraryQueryKey(tripId),
    queryFn: () => fetchItinerary(tripId),
    initialData: initialDays,
  });

  const dayTabs = days.map((day) => ({
    id: day.id,
    dayLabel: `第 ${day.order} 天`,
    dateLabel: formatDate(day.date),
  }));

  return (
    <div className="space-y-6">
      <DayTabsNav days={dayTabs} />

      <div className="space-y-8">
        {days.map((day) => (
          <section
            key={day.id}
            id={`day-${day.id}`}
            className="scroll-mt-20 space-y-3"
          >
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">
                  第 {day.order} 天 · {formatDate(day.date)}
                </h2>
                <DayStartTimeDialog dayId={day.id} startTime={day.start_time} />
              </div>
              <AddActivityDialog tripId={tripId} dayId={day.id} />
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
    </div>
  );
}
