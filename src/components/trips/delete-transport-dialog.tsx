"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteTransport } from "@/lib/actions/transports";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DeleteTransportDialog({
  activityId,
  open,
  onOpenChange,
}: {
  activityId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [serverError, setServerError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  // Rule: 刪除交通時間需經使用者確認才會執行
  function handleConfirm() {
    setServerError(undefined);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("after_activity_id", String(activityId));
      formData.set("confirm_deletion", "true");

      const result = await deleteTransport({}, formData);

      if (result.error) {
        setServerError(result.error);
        return;
      }

      toast.success("交通時間已刪除");
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
          <DialogTitle>確定要刪除這段交通時間嗎？</DialogTitle>
          <DialogDescription>刪除後無法復原。</DialogDescription>
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
          {/* Rule: 成員可以刪除交通時間 */}
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
