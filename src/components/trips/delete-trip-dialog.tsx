"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteTrip } from "@/lib/actions/trips";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Trip = {
  id: number;
  name: string;
};

export function DeleteTripDialog({
  trip,
  open,
  onOpenChange,
}: {
  trip: Trip;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [serverError, setServerError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  // Rule: 刪除旅程需經使用者確認才會執行
  function handleConfirm() {
    setServerError(undefined);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("trip_id", String(trip.id));
      formData.set("confirm_deletion", "true");

      const result = await deleteTrip({}, formData);

      if (result.error) {
        setServerError(result.error);
        return;
      }

      toast.success("旅程已刪除");
      onOpenChange(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) setServerError(undefined);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>確定要刪除「{trip.name}」嗎？</DialogTitle>
          <DialogDescription>
            刪除後，旅程的日期、行程、交通時間與開支都會一併刪除，且無法復原。
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            取消
          </Button>
          {/* Rule: owner 成功刪除旅程 */}
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? "刪除中…" : "確認刪除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
