"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  applyActivityEvent,
  applyDayEvent,
  applyTransportEvent,
  type ActivityRow,
  type CachedDay,
  type DayRow,
  type ItineraryEventType,
  type TransportRow,
} from "@/lib/itinerary-cache";
import { itineraryQueryKey } from "@/lib/queries/itinerary";

/**
 * Feature: 行程即時同步
 * 對應規格：各 spec/features/*.feature 內「其他團員異動後，正在查看行程的使用者即時看到更新」規則
 *
 * 訂閱本旅程 days/activities/transports 的異動，事件到達時直接局部更新 itinerary 的 Query cache，
 * 不整包 invalidate 重抓（見 src/lib/itinerary-cache.ts 的合併邏輯）。做法比照
 * LedgerRealtimeRefresher：先設定 Realtime 的 access token 再訂閱，RLS 才能在
 * 「加入 channel 當下」正確判斷身分，避免以 anon 身分訂閱導致收不到事件。
 */
export function useItineraryRealtime(tripId: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    function patch<Row>(
      apply: (days: CachedDay[], eventType: ItineraryEventType, row: Row) => CachedDay[],
    ) {
      return (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        const eventType = payload.eventType as ItineraryEventType;
        const row = (eventType === "DELETE" ? payload.old : payload.new) as Row;
        queryClient.setQueryData<CachedDay[]>(itineraryQueryKey(tripId), (days) =>
          days ? apply(days, eventType, row) : days,
        );
      };
    }

    const subscribe = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) await supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel(`trip-${tripId}-itinerary`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "days", filter: `trip_id=eq.${tripId}` },
          patch<DayRow>(applyDayEvent),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "activities", filter: `trip_id=eq.${tripId}` },
          patch<ActivityRow>(applyActivityEvent),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "transports", filter: `trip_id=eq.${tripId}` },
          patch<TransportRow>(applyTransportEvent),
        )
        .subscribe();
    };
    subscribe();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [queryClient, tripId]);
}
