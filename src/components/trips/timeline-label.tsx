import { TriangleAlert } from "lucide-react"
import type { TimelineSlot } from "@/lib/timeline"

// 時間軸左側的時間標籤；跨過午夜時於時間下方標示隔天日期；時間衝突時標示警告圖示
export function TimelineLabel({
  slot,
  dayDate,
  hasConflict,
}: {
  slot: TimelineSlot | null
  dayDate: string
  hasConflict?: boolean
}) {
  return (
    <div className="flex w-11 shrink-0 flex-col items-end text-right">
      {slot && (
        <>
          <span className="flex items-center gap-1 text-xs font-medium tabular-nums">
            {hasConflict && (
              <TriangleAlert
                className="size-3 text-destructive"
                aria-label="時間衝突"
              />
            )}
            {slot.time}
          </span>
          {slot.date !== dayDate && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {formatShortDate(slot.date)}
            </span>
          )}
        </>
      )}
    </div>
  )
}

function formatShortDate(date: string) {
  const [, month, day] = date.split("-")
  return `${Number(month)}/${Number(day)}`
}
