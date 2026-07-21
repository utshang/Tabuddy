"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { deleteActivity } from "@/lib/actions/activities";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Activity = {
  id: number;
  name: string;
};

export function DeleteActivityDialog({
  tripId,
  activity,
}: {
  tripId: number;
  activity: Activity;
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  // Rule: 刪除行程需經使用者確認才會執行
  function handleConfirm() {
    setServerError(undefined);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("activity_id", String(activity.id));
      formData.set("trip_id", String(tripId));
      formData.set("confirm_deletion", "true");

      const result = await deleteActivity({}, formData);

      if (result.error) {
        setServerError(result.error);
        return;
      }

      toast.success("行程已刪除");
      setOpen(false);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setServerError(undefined);
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Trash2 />
        <span className="sr-only">刪除行程</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>確定要刪除「{activity.name}」嗎？</DialogTitle>
          <DialogDescription>
            刪除後，此行程後接的交通時間也會一併刪除，且無法復原。
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
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            取消
          </Button>
          {/* Rule: 成員可以刪除行程 */}
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
