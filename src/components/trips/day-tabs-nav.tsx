"use client"

import { useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function DayTabsNav({
  days,
}: {
  days: { id: number; dayLabel: string; dateLabel: string }[]
}) {
  const [active, setActive] = useState(
    days[0] ? String(days[0].id) : undefined,
  )

  function handleChange(value: unknown) {
    const dayId = String(value)
    setActive(dayId)
    document
      .getElementById(`day-${dayId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (days.length === 0) return null

  return (
    <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 sm:mx-0 sm:px-0">
      <Tabs value={active} onValueChange={handleChange}>
        <TabsList className="h-16 w-full justify-start gap-1 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
          {days.map((day) => (
            <TabsTrigger
              key={day.id}
              value={String(day.id)}
              className="h-full shrink-0 flex-col justify-center gap-0.5 px-3"
            >
              <span>{day.dateLabel}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  )
}
