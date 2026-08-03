"use client";

import { toast } from "sonner";
import { deleteTrip } from "@/lib/actions/trips";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

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
  // Rule: owner 成功刪除旅程
  async function handleConfirm() {
    const formData = new FormData();
    formData.set("trip_id", String(trip.id));
    formData.set("confirm_deletion", "true");

    const result = await deleteTrip({}, formData);
    if (result.error) throw new Error(result.error);
    toast.success("旅程已刪除");
  }

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`確定要刪除「${trip.name}」嗎？`}
      description="刪除後，旅程的日期、行程、交通時間與開支都會一併刪除，且無法復原。"
      errorFallback="刪除旅程失敗"
      onConfirm={handleConfirm}
    />
  );
}
