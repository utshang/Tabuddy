"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import type { CachedDay, CachedTransport } from "@/lib/itinerary-cache";
import { itineraryQueryKey } from "@/lib/queries/itinerary";

export function DeleteTransportDialog({
  activityId,
  transport,
  open,
  onOpenChange,
}: {
  activityId: number;
  transport: CachedTransport;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [serverError, setServerError] = useState<string>();
  const queryClient = useQueryClient();
  const queryKey = itineraryQueryKey(transport.trip_id);

  // Rule: 成員可以刪除交通時間（樂觀更新，失敗時回滾）
  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set("after_activity_id", String(activityId));
      formData.set("confirm_deletion", "true");

      const result = await deleteTransport({}, formData);
      if (result.error) throw new Error(result.error);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CachedDay[]>(queryKey);
      queryClient.setQueryData<CachedDay[]>(queryKey, (days) =>
        days
          ? days.map((day) => ({
              ...day,
              activities: day.activities.map((a) =>
                a.transport?.id === transport.id ? { ...a, transport: null } : a,
              ),
            }))
          : days,
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success("交通時間已刪除");
      onOpenChange(false);
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      setServerError(error instanceof Error ? error.message : "刪除交通時間失敗");
    },
  });

  // Rule: 刪除交通時間需經使用者確認才會執行
  function handleConfirm() {
    setServerError(undefined);
    mutation.mutate();
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
            disabled={mutation.isPending}
          >
            取消
          </Button>
          {/* Rule: 成員可以刪除交通時間 */}
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "刪除中…" : "確認刪除"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
