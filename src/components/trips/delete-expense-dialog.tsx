"use client";

import { toast } from "sonner";
import { deleteExpense } from "@/lib/actions/expenses";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

type Expense = {
  id: number;
  name: string;
};

export function DeleteExpenseDialog({
  expense,
  tripId,
  open,
  onOpenChange,
}: {
  expense: Expense;
  tripId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // Rule: 成員可以刪除開支，不限付款人或分攤參與者；刪除開支後其分攤明細一併刪除
  async function handleConfirm() {
    const formData = new FormData();
    formData.set("expense_id", String(expense.id));
    formData.set("trip_id", String(tripId));
    formData.set("confirm_deletion", "true");

    const result = await deleteExpense({}, formData);
    if (result.error) throw new Error(result.error);
    toast.success("開支已刪除");
  }

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`確定要刪除「${expense.name}」嗎？`}
      description="刪除後，此開支的分攤明細也會一併刪除，且無法復原。"
      errorFallback="刪除開支失敗"
      onConfirm={handleConfirm}
    />
  );
}
