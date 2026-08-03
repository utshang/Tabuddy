"use client"

import { useState } from "react"
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditActivityDialog } from "@/components/trips/edit-activity-dialog"
import { DeleteActivityDialog } from "@/components/trips/delete-activity-dialog"

type Activity = {
  id: number
  day_id: number
  trip_id: number
  order: number
  name: string
  google_map_url: string | null
  duration_minutes: number
  note: string | null
  fixed_time: string | null
}

export function ActivityActionsMenu({
  tripId,
  activity,
}: {
  tripId: number
  activity: Activity
}) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal />
          <span className="sr-only">行程選單</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            編輯
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => setDeleteOpen(true)}
          >
            刪除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditActivityDialog
        activity={activity}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <DeleteActivityDialog
        tripId={tripId}
        activity={activity}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  )
}
