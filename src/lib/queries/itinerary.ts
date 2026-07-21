/**
 * Feature: 行程即時同步
 * 對應規格：各 spec/features/*.feature 內「其他團員異動後，正在查看行程的使用者即時看到更新」規則
 *
 * client 端讀取行程用 Supabase JS client（吃 RLS），initial 資料仍由 Server Component 用 Prisma
 * 撈取後當作 useQuery 的 initialData；這裡的 fetchItinerary 只在背景 refetch 時被呼叫。
 */
import { createClient } from "@/lib/supabase/client";
import type { CachedDay } from "@/lib/itinerary-cache";

export function itineraryQueryKey(tripId: number) {
  return ["itinerary", tripId] as const;
}

type RawTransport = {
  id: number;
  after_activity_id: number;
  trip_id: number;
  hours: number;
  minutes: number;
  mode: string;
  icon: string | null;
} | null;

type RawActivity = {
  id: number;
  day_id: number;
  trip_id: number;
  name: string;
  google_map_url: string | null;
  duration_minutes: number;
  note: string | null;
  order: number;
  transport: RawTransport;
};

type RawDay = {
  id: number;
  trip_id: number;
  date: string;
  start_time: string | null;
  order: number;
  activities: RawActivity[];
};

export async function fetchItinerary(tripId: number): Promise<CachedDay[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("days")
    .select(
      "id, trip_id, date, start_time, order, activities(id, day_id, trip_id, name, google_map_url, duration_minutes, note, order, transport:transports(id, after_activity_id, trip_id, hours, minutes, mode, icon))",
    )
    .eq("trip_id", tripId)
    .order("order", { ascending: true });

  if (error) throw error;

  const days = (data ?? []) as unknown as RawDay[];

  return days
    .map((day) => ({
      ...day,
      activities: [...day.activities].sort((a, b) => a.order - b.order),
    }))
    .sort((a, b) => a.order - b.order);
}
