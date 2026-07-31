"use client";

import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// spec.md 設計與 UI 規範：進入旅程後分為兩個 Tab（行程、記帳），預設顯示「行程」
// header + TabsList 包在同一個 sticky 容器，往下捲動時只有 TabsContent 內容會滑動。
// id="trip-page-header" 給 DayTabsNav 量測高度，讓行程分頁的日期列能貼在這層下方。
export function TripTabs({
  header,
  itinerary,
  ledger,
}: {
  header: ReactNode;
  itinerary: ReactNode;
  ledger: ReactNode;
}) {
  return (
    <Tabs defaultValue="itinerary">
      <div
        id="trip-page-header"
        className="sticky top-0 z-20 space-y-4 bg-background/95 pb-2 backdrop-blur"
      >
        {header}
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="itinerary">行程</TabsTrigger>
          <TabsTrigger value="ledger">記帳</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="itinerary">{itinerary}</TabsContent>
      <TabsContent value="ledger">{ledger}</TabsContent>
    </Tabs>
  );
}
