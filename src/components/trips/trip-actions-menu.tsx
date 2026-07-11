"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { shareTrip } from "@/lib/actions/trips";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditTripDialog } from "@/components/trips/edit-trip-dialog";
import { DeleteTripDialog } from "@/components/trips/delete-trip-dialog";

type Trip = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
};

export function TripActionsMenu({
  trip,
  isOwner,
}: {
  trip: Trip;
  isOwner: boolean;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isSharing, startShareTransition] = useTransition();

  // Rule: 旅程成員（owner 或 member）分享後系統回傳該旅程的分享連結
  function handleShare() {
    startShareTransition(async () => {
      const result = await shareTrip(trip.id);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const link = `${window.location.origin}/join/${result.inviteToken}`;
      const text = `Hey Buddy! 一起加入旅程吧：${link}`;

      if (navigator.share) {
        try {
          await navigator.share({ text });
        } catch (error) {
          if (error instanceof Error && error.name === "AbortError") return;
          throw error;
        }
        return;
      }

      await navigator.clipboard.writeText(text);
      toast.success("分享連結已複製");
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal />
          <span className="sr-only">旅程選單</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            編輯
          </DropdownMenuItem>
          <DropdownMenuItem disabled={isSharing} onClick={handleShare}>
            分享
          </DropdownMenuItem>
          {isOwner && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              刪除
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditTripDialog trip={trip} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteTripDialog
        trip={trip}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
