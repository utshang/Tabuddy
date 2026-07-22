"use client"

import { useEffect, useRef, useState } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function DayTabsNav({
  days,
}: {
  days: { id: number; dayLabel: string; dateLabel: string }[]
}) {
  const [active, setActive] = useState(
    days[0] ? String(days[0].id) : undefined,
  )
  const headerRef = useRef<HTMLDivElement>(null)
  const suppressScrollSpyRef = useRef(false)

  useEffect(() => {
    if (days.length === 0) return

    let ticking = false

    function updateActiveFromScroll() {
      ticking = false
      if (suppressScrollSpyRef.current) return

      const triggerLine = (headerRef.current?.offsetHeight ?? 0) + 1

      let currentId: string | undefined
      for (const day of days) {
        const top = document
          .getElementById(`day-${day.id}`)
          ?.getBoundingClientRect().top

        if (top === undefined || top > triggerLine) break
        currentId = String(day.id)
      }

      if (currentId !== undefined) setActive(currentId)
    }

    function handleScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(updateActiveFromScroll)
    }

    updateActiveFromScroll()
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [days])

  function handleChange(value: unknown) {
    const dayId = String(value)
    setActive(dayId)

    suppressScrollSpyRef.current = true

    let cleared = false
    function clearSuppress() {
      if (cleared) return
      cleared = true
      suppressScrollSpyRef.current = false
      window.removeEventListener("scrollend", clearSuppress)
    }

    // 捲動距離會隨目標日期遠近變動，固定 timeout 可能在動畫跑完前就先解除，
    // 導致 scroll-spy 在捲動途中誤判成中間的日期。優先用 scrollend 偵測真正
    // 捲動結束，timeout 僅作為（例如目標本來就在畫面內、不會觸發 scrollend）的保險。
    window.addEventListener("scrollend", clearSuppress, { once: true })
    window.setTimeout(clearSuppress, 1200)

    document
      .getElementById(`day-${dayId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (days.length === 0) return null

  return (
    <div
      ref={headerRef}
      className="sticky top-0 z-10 bg-background/95 py-2"
    >
      <Tabs value={active} onValueChange={handleChange}>
        <TabsList className="h-16 w-full justify-start gap-1 overflow-x-auto overscroll-x-contain scrollbar-none [&::-webkit-scrollbar]:hidden">
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
