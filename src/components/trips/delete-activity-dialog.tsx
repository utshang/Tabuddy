"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteActivity } from "@/lib/actions/activities";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CachedDay } from "@/lib/itinerary-cache";
import { itineraryQueryKey } from "@/lib/queries/itinerary";

type Activity = {
  id: number;
  day_id: number;
  name: string;
};

export function DeleteActivityDialog({
  tripId,
  activity,
  open,
  onOpenChange,
}: {
  tripId: number;
  activity: Activity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [serverError, setServerError] = useState<string>();
  const queryClient = useQueryClient();
  const queryKey = itineraryQueryKey(tripId);

  // Rule: 成員可以刪除行程（樂觀更新，失敗時回滾）
  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set("activity_id", String(activity.id));
      formData.set("trip_id", String(tripId));
      formData.set("confirm_deletion", "true");

      const result = await deleteActivity({}, formData);
      if (result.error) throw new Error(result.error);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CachedDay[]>(queryKey);
      queryClient.setQueryData<CachedDay[]>(queryKey, (days) =>
        days
          ? days.map((day) =>
              day.id === activity.day_id
                ? { ...day, activities: day.activities.filter((a) => a.id !== activity.id) }
                : day,
            )
          : days,
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success("行程已刪除");
      onOpenChange(false);
    },
    onError: (error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      setServerError(error instanceof Error ? error.message : "刪除行程失敗");
    },
  });

  // Rule: 刪除行程需經使用者確認才會執行
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
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            取消
          </Button>
          {/* Rule: 成員可以刪除行程 */}
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
