"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  EditExpenseDialog,
  type EditableExpense,
} from "@/components/trips/edit-expense-dialog";
import type { ExpenseMember } from "@/components/trips/add-expense-dialog";

export function ExpenseActionsMenu({
  expense,
  members,
}: {
  expense: EditableExpense;
  members: ExpenseMember[];
}) {
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal />
          <span className="sr-only">開支選單</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            編輯
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditExpenseDialog
        expense={expense}
        members={members}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
