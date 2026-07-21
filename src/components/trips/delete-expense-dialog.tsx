"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteExpense } from "@/lib/actions/expenses";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [serverError, setServerError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  // Rule: 刪除開支需經使用者確認才會執行
  function handleConfirm() {
    setServerError(undefined);
    startTransition(async () => {
      const formData = new FormData();
      formData.set("expense_id", String(expense.id));
      formData.set("trip_id", String(tripId));
      formData.set("confirm_deletion", "true");

      const result = await deleteExpense({}, formData);

      if (result.error) {
        setServerError(result.error);
        return;
      }

      toast.success("開支已刪除");
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
          <DialogTitle>確定要刪除「{expense.name}」嗎？</DialogTitle>
          {/* Rule: 刪除開支後其分攤明細一併刪除 */}
          <DialogDescription>
            刪除後，此開支的分攤明細也會一併刪除，且無法復原。
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
          {/* Rule: 成員可以刪除開支，不限付款人或分攤參與者 */}
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
