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
  const dayIdsKey = days.map((day) => day.id).join(",")

  // 上方還疊了一層「返回連結 + 標題 + 行程/記帳」的 sticky 頁首（trip-tabs.tsx
  // 的 #trip-page-header），這層日期分頁要貼在它下面，而不是視窗最上方。用
  // ResizeObserver 量測該頁首的實際高度，頁首因內容（例如旅程名稱換行）改變
  // 高度時也會自動跟著調整位置。
  const [pageHeaderHeight, setPageHeaderHeight] = useState(0)

  useEffect(() => {
    const pageHeader = document.getElementById("trip-page-header")
    if (!pageHeader) return

    const observer = new ResizeObserver(([entry]) => {
      setPageHeaderHeight(entry.contentRect.height)
    })
    observer.observe(pageHeader)
    return () => observer.disconnect()
  }, [])

  // 用 IntersectionObserver 取代手動監聽 scroll + getBoundingClientRect：
  // 每個活動的圖片、備註等內容非同步載入時都可能讓區塊高度變動，手動算法只在
  // scroll 事件當下取樣一次，錯過之後的版面偏移；IntersectionObserver 會在
  // 版面變動時自動重新觸發，天數分頁的 active 狀態才會持續跟著實際捲動位置走。
  useEffect(() => {
    if (days.length === 0) return

    const headerHeight = pageHeaderHeight + (headerRef.current?.offsetHeight ?? 0)
    document.documentElement.style.setProperty(
      "--sticky-offset",
      `${headerHeight}px`,
    )

    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressScrollSpyRef.current) return

        const topMost = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]

        if (topMost) {
          setActive(topMost.target.id.replace("day-", ""))
        }
      },
      { rootMargin: `-${headerHeight}px 0px -70% 0px` },
    )

    for (const day of days) {
      const el = document.getElementById(`day-${day.id}`)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayIdsKey, pageHeaderHeight])

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
      className="sticky z-10 py-2"
      style={{ top: `${pageHeaderHeight}px` }}
    >
      <Tabs value={active} onValueChange={handleChange}>
        <TabsList className="h-16 w-full justify-start gap-1 overflow-x-auto overflow-y-hidden overscroll-x-contain scrollbar-none [&::-webkit-scrollbar]:hidden">
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
