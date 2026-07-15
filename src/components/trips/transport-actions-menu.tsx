"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditTransportDialog } from "@/components/trips/edit-transport-dialog";

type Transport = {
  hours: number;
  minutes: number;
  mode: string;
  icon: string | null;
};

export function TransportActionsMenu({
  activityId,
  transport,
}: {
  activityId: number;
  transport: Transport;
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal />
          <span className="sr-only">交通時間選單</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            編輯
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditTransportDialog
        activityId={activityId}
        transport={transport}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
