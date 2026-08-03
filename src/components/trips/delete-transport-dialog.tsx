"use client";

import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteTransport } from "@/lib/actions/transports";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
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
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
  });

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="確定要刪除這段交通時間嗎？"
      description="刪除後無法復原。"
      errorFallback="刪除交通時間失敗"
      onConfirm={() => mutation.mutateAsync()}
    />
  );
}
