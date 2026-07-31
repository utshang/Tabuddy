"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Rule: 備註內的網址自動轉為可點擊連結
const URL_PATTERN = /(https?:\/\/[^\s]+)/g

function renderNoteWithLinks(note: string) {
  // split 搭配有 capturing group 的 regex 時，奇數 index 一定是命中的網址，偶數是純文字
  return note.split(URL_PATTERN).map((part, i) =>
    i % 2 === 1 ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noreferrer"
        className="break-all text-primary underline"
      >
        {part}
      </a>
    ) : (
      part
    ),
  )
}

export function ActivityNoteDialog({
  activity,
  open,
  onOpenChange,
}: {
  activity: { name: string; note: string | null }
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{activity.name}</DialogTitle>
        </DialogHeader>
        {activity.note ? (
          <p className="wrap-break-word whitespace-pre-wrap text-sm text-muted-foreground">
            {renderNoteWithLinks(activity.note)}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">尚無備註</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
