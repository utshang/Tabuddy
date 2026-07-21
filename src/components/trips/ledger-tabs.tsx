"use client";

import { useState, type ReactNode } from "react";

// 帳本內的 開支／結餘 切換（對照 doc/design-refs/expense.jpg 與 expense-split.jpg 上方的分段切換；
export function LedgerTabs({
  expenses,
  settlement,
}: {
  expenses: ReactNode;
  settlement: ReactNode;
}) {
  const [view, setView] = useState<"expenses" | "settlement">("expenses");

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-lg bg-muted p-[3px] text-sm text-muted-foreground">
          {(
            [
              ["expenses", "開支"],
              ["settlement", "結餘"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setView(value)}
              className={
                view === value
                  ? "rounded-md bg-background px-4 py-1 font-medium text-foreground shadow-sm"
                  : "px-4 py-1 transition-colors hover:text-foreground"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "expenses" ? expenses : settlement}
    </div>
  );
}
