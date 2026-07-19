"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Feature: 查看結算
 * Rule: 其他團員異動開支後，正在查看結算的使用者所見結算結果即時更新
 * 對應規格：spec/features/查看結算.feature
 *
 * 以 Supabase Realtime（Postgres Changes）訂閱本旅程開支與分攤明細的異動，
 * 事件到達後 debounce 重新整理路由，由 Server Component 重新查詢並以純函式重算結算。
 * INSERT / UPDATE 事件依 RLS select policy（trip_members）過濾接收者；
 * DELETE 事件僅帶主鍵（replica identity），無法以 trip_id 過濾，故不設 filter 直接刷新。
 */
export function LedgerRealtimeRefresher({ tripId }: { tripId: number }) {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const refresh = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => router.refresh(), 300);
    };

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // 訂閱前先載入 session 並設定 Realtime 的 access token：
    // RLS 過濾以「加入 channel 當下」的身分判定，若先以 anon 身分訂閱，
    // INSERT / UPDATE 事件會被 member select policy 擋下而收不到。
    const subscribe = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) await supabase.realtime.setAuth(session.access_token);

      channel = supabase
        .channel(`trip-${tripId}-ledger`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "expenses",
            filter: `trip_id=eq.${tripId}`,
          },
          refresh,
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "expenses" },
          refresh,
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "expense_splits" },
          refresh,
        )
        .subscribe();
    };
    subscribe();

    return () => {
      cancelled = true;
      if (timer.current) clearTimeout(timer.current);
      if (channel) supabase.removeChannel(channel);
    };
  }, [router, tripId]);

  return null;
}
