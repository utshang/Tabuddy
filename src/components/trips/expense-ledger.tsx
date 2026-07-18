import { getCategoryIcon } from "@/lib/expense-categories";
import { formatExpenseDate, formatYen } from "@/lib/currency";
import {
  AddExpenseDialog,
  type ExpenseMember,
} from "@/components/trips/add-expense-dialog";

export type LedgerExpense = {
  id: number;
  name: string;
  amount: number;
  category: string;
  category_icon: string | null;
  expense_date: string;
  payerName: string;
  payerIsMe: boolean;
  myShare: number;
};

// 帳本「開支」區塊（對照 doc/design-refs/expense.jpg）：
// 上方為 我的開支 / 總支出 總覽，開支依日期分組顯示，底部為新增開支按鈕。
// 「結餘」屬查看結算功能，本階段尚未實作，僅保留切換的視覺佔位。
export function ExpenseLedger({
  tripId,
  expenses,
  members,
}: {
  tripId: number;
  expenses: LedgerExpense[];
  members: ExpenseMember[];
}) {
  // 我的開支 = 我被分攤的總金額；總支出 = 所有開支金額總和
  const myTotal = expenses.reduce((sum, e) => sum + e.myShare, 0);
  const grandTotal = expenses.reduce((sum, e) => sum + e.amount, 0);

  const groups: Array<{ date: string; items: LedgerExpense[] }> = [];
  for (const expense of expenses) {
    const group = groups.at(-1);
    if (group?.date === expense.expense_date) {
      group.items.push(expense);
    } else {
      groups.push({ date: expense.expense_date, items: [expense] });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="inline-flex items-center rounded-lg bg-muted p-[3px] text-sm text-muted-foreground">
          <span className="rounded-md bg-background px-4 py-1 font-medium text-foreground shadow-sm">
            開支
          </span>
          <span
            className="cursor-not-allowed px-4 py-1 opacity-50"
            title="結餘（即將推出）"
          >
            結餘
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-center">
        <div>
          <p className="text-sm text-muted-foreground">我的開支</p>
          <p className="text-2xl font-bold tracking-tight">
            {formatYen(myTotal)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">總支出</p>
          <p className="text-2xl font-bold tracking-tight">
            {formatYen(grandTotal)}
          </p>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center">
          <p className="text-lg font-medium">還沒有任何開支</p>
          <p className="mt-1 text-sm text-muted-foreground">
            點擊「新增開支」記下第一筆
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.date} className="space-y-2">
              <h3 className="text-sm font-semibold">
                {formatExpenseDate(group.date)}
              </h3>
              <ul className="space-y-2">
                {group.items.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
                  >
                    <span className="text-xl" aria-hidden>
                      {getCategoryIcon(expense.category, expense.category_icon)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{expense.name}</p>
                      <p className="text-sm text-muted-foreground">
                        由 {expense.payerName}
                        {expense.payerIsMe && " (我)"} 支付
                      </p>
                    </div>
                    <p className="text-lg font-semibold tracking-tight">
                      {formatYen(expense.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="flex justify-center pt-2">
        <AddExpenseDialog tripId={tripId} members={members} />
      </div>
    </div>
  );
}
