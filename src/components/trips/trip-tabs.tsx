"use client";

import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

// spec.md 設計與 UI 規範：進入旅程後分為兩個 Tab（行程、記帳），預設顯示「行程」
export function TripTabs({
  itinerary,
  ledger,
}: {
  itinerary: ReactNode;
  ledger: ReactNode;
}) {
  return (
    <Tabs defaultValue="itinerary">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="itinerary">行程</TabsTrigger>
        <TabsTrigger value="ledger">記帳</TabsTrigger>
      </TabsList>
      <TabsContent value="itinerary">{itinerary}</TabsContent>
      <TabsContent value="ledger">{ledger}</TabsContent>
    </Tabs>
  );
}
