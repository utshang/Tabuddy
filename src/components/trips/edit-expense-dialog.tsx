"use client";

import { useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { editExpense } from "@/lib/actions/expenses";
import {
  editExpenseFormSchema,
  type EditExpenseFormValues,
} from "@/lib/validations/expenses";
import {
  EXPENSE_CATEGORY_PRESETS,
  isPresetCategory,
} from "@/lib/expense-categories";
import { splitEvenly } from "@/lib/expense-split";
import { formatYen } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputDate } from "@/components/ui/input-date";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ExpenseMember } from "@/components/trips/add-expense-dialog";
import { formatDateValue, parseDateValue } from "@/lib/date";

const CUSTOM_OPTION = "__custom__";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50";

export type EditableExpense = {
  id: number;
  name: string;
  amount: number;
  category: string;
  category_icon: string | null;
  expense_date: string;
  payer_id: string;
  split_type: "even" | "custom";
  /** 既有分攤明細：user_id → 分攤金額 */
  splits: Record<string, number>;
};

export function EditExpenseDialog({
  expense,
  members,
  open,
  onOpenChange,
}: {
  expense: EditableExpense;
  members: ExpenseMember[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [serverError, setServerError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const initialCategoryOption = isPresetCategory(expense.category)
    ? expense.category
    : CUSTOM_OPTION;
  const [categoryOption, setCategoryOption] = useState<string>(
    initialCategoryOption,
  );
  // Rule: 編輯分攤方式而未重新指定參與者時沿用原參與者名單（以既有分攤明細預填勾選）
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(members.map((m) => [m.id, m.id in expense.splits])),
  );
  // 自訂金額以既有明細預填；僅修改開支金額時分攤總和將不再對平，送出會被擋下
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        Object.entries(expense.splits).map(([id, amount]) => [
          id,
          String(amount),
        ]),
      ),
  );
  const formRef = useRef<HTMLFormElement>(null);
  const isCustomCategory = categoryOption === CUSTOM_OPTION;

  const initialValues: EditExpenseFormValues = {
    expense_id: expense.id,
    name: expense.name,
    amount: expense.amount,
    category: expense.category,
    category_icon: expense.category_icon ?? undefined,
    payer_id: expense.payer_id,
    expense_date: expense.expense_date,
    split_type: expense.split_type,
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<EditExpenseFormValues>({
    resolver: zodResolver(editExpenseFormSchema),
    defaultValues: initialValues,
  });

  const splitType = useWatch({ control, name: "split_type" });
  const watchedAmount = Number(useWatch({ control, name: "amount" }));
  const expenseDate = useWatch({ control, name: "expense_date" });

  const checkedMembers = members.filter((m) => checked[m.id]);

  // Rule: 編輯後採均分時金額平均分配至小數第二位，尾差以 0.01 依參與者加入旅程的先後順序分配給前幾位參與者
  // members 已依加入順序排列，此處即時預覽每位參與者的分攤金額（與 server 端計算共用同一純函式）
  const evenShares = (() => {
    if (splitType !== "even" || checkedMembers.length === 0) return null;
    try {
      const shares = splitEvenly(watchedAmount, checkedMembers.length);
      return Object.fromEntries(
        checkedMembers.map((m, i) => [m.id, shares[i]]),
      ) as Record<string, number>;
    } catch {
      return null;
    }
  })();

  // Rule: 編輯後採自訂金額時各參與者分攤金額之和必須等於開支金額（即時顯示差額）
  const customSummary = (() => {
    if (splitType !== "custom") return null;
    const sumCents = checkedMembers.reduce((sum, m) => {
      const value = Number(customAmounts[m.id] ?? "");
      if (!Number.isFinite(value)) return sum;
      return sum + Math.round(value * 100);
    }, 0);
    const amountCents = Number.isFinite(watchedAmount)
      ? Math.round(watchedAmount * 100)
      : 0;
    return { sum: sumCents / 100, diff: (amountCents - sumCents) / 100 };
  })();

  function resetForm() {
    setCategoryOption(initialCategoryOption);
    setChecked(
      Object.fromEntries(members.map((m) => [m.id, m.id in expense.splits])),
    );
    setCustomAmounts(
      Object.fromEntries(
        Object.entries(expense.splits).map(([id, amount]) => [
          id,
          String(amount),
        ]),
      ),
    );
    formRef.current?.reset();
    reset(initialValues);
  }

  function handleCategoryOptionChange(next: string) {
    setCategoryOption(next);
    if (next === CUSTOM_OPTION) {
      // Rule: 自定義類別的名稱與圖示皆可編輯（切換回原本的自定義類別時還原原值；否則清空待輸入）
      if (initialCategoryOption === CUSTOM_OPTION) {
        setValue("category", expense.category, { shouldValidate: true });
        setValue("category_icon", expense.category_icon ?? undefined);
      } else {
        setValue("category", "", { shouldValidate: true });
        setValue("category_icon", undefined);
      }
    } else {
      // Rule: 類別改為預設選項時圖示自動清除（前端先清空，後端亦強制）
      setValue("category", next, { shouldValidate: true });
      setValue("category_icon", undefined);
    }
  }

  const onSubmit = handleSubmit(() => {
    // Rule: 成員可以編輯分攤方式與參與者，參與分攤的團員至少一人（client 端先擋，server 端仍會驗證）
    if (checkedMembers.length === 0) {
      setServerError("參與分攤的團員至少一人");
      return;
    }

    setServerError(undefined);
    startTransition(async () => {
      const result = await editExpense({}, new FormData(formRef.current!));

      if (result.error) {
        setServerError(result.error);
        return;
      }

      toast.success("開支已更新");
      onOpenChange(false);
    });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          resetForm();
          setServerError(undefined);
        }
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>編輯開支</DialogTitle>
          <DialogDescription>
            修改品項、金額、類別、付款人或分攤方式。
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <input type="hidden" {...register("expense_id")} />

          <div className="space-y-2">
            <Label htmlFor={`edit-expense-name-${expense.id}`}>標題</Label>
            <Input
              id={`edit-expense-name-${expense.id}`}
              type="text"
              placeholder="例如：飲料"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-expense-category-option-${expense.id}`}>
              類別
            </Label>
            <select
              id={`edit-expense-category-option-${expense.id}`}
              value={categoryOption}
              onChange={(e) => handleCategoryOptionChange(e.target.value)}
              className={selectClassName}
            >
              {EXPENSE_CATEGORY_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.icon} {preset.value}
                </option>
              ))}
              <option value={CUSTOM_OPTION}>✏️ 新增自定義類別…</option>
            </select>
          </div>

          {!isCustomCategory && (
            <>
              <input type="hidden" {...register("category")} />
              <input type="hidden" {...register("category_icon")} />
            </>
          )}

          {isCustomCategory && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`edit-expense-category-${expense.id}`}>
                  類別名稱
                </Label>
                <Input
                  id={`edit-expense-category-${expense.id}`}
                  type="text"
                  placeholder="例如：門票"
                  {...register("category")}
                />
                {errors.category && (
                  <p className="text-sm text-destructive">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`edit-expense-category-icon-${expense.id}`}>
                  圖示（選填）
                </Label>
                <Input
                  id={`edit-expense-category-icon-${expense.id}`}
                  type="text"
                  placeholder="🎫"
                  {...register("category_icon")}
                />
                <p className="text-xs text-muted-foreground">
                  未填寫時將以名稱文字顯示代替
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`edit-expense-amount-${expense.id}`}>金額</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                ¥
              </span>
              <Input
                id={`edit-expense-amount-${expense.id}`}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0"
                className="pl-7"
                {...register("amount")}
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive">
                {errors.amount.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-expense-payer-${expense.id}`}>支付者</Label>
              <select
                id={`edit-expense-payer-${expense.id}`}
                className={selectClassName}
                {...register("payer_id")}
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                    {m.isMe && "（我）"}
                  </option>
                ))}
              </select>
              {errors.payer_id && (
                <p className="text-sm text-destructive">
                  {errors.payer_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-expense-date-${expense.id}`}>何時</Label>
              <input type="hidden" {...register("expense_date")} />
              <InputDate
                id={`edit-expense-date-${expense.id}`}
                date={expenseDate ? parseDateValue(expenseDate) : undefined}
                onSelect={(date) => {
                  if (date) {
                    setValue("expense_date", formatDateValue(date), {
                      shouldValidate: true,
                    });
                  }
                }}
              />
              {errors.expense_date && (
                <p className="text-sm text-destructive">
                  {errors.expense_date.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>分攤</Label>
              <select
                aria-label="分攤方式"
                className={`${selectClassName} h-8 w-auto`}
                {...register("split_type")}
              >
                <option value="even">平均分配</option>
                <option value="custom">自訂金額</option>
              </select>
            </div>

            <ul className="divide-y rounded-lg border">
              {members.map((member) => {
                const isChecked = checked[member.id] ?? false;
                return (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      name="participants"
                      value={member.id}
                      checked={isChecked}
                      onChange={(e) =>
                        setChecked((prev) => ({
                          ...prev,
                          [member.id]: e.target.checked,
                        }))
                      }
                      className="size-4 accent-primary"
                      aria-label={`參與分攤：${member.name}`}
                    />
                    <span
                      className={`flex-1 text-sm ${isChecked ? "" : "text-muted-foreground line-through"}`}
                    >
                      {member.name}
                      {member.isMe && "（我）"}
                    </span>
                    {isChecked && splitType === "even" && (
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {evenShares ? formatYen(evenShares[member.id]) : "¥ —"}
                      </span>
                    )}
                    {isChecked && splitType === "custom" && (
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0"
                        className="h-8 w-24 text-right"
                        name={`custom_amount_${member.id}`}
                        value={customAmounts[member.id] ?? ""}
                        onChange={(e) =>
                          setCustomAmounts((prev) => ({
                            ...prev,
                            [member.id]: e.target.value,
                          }))
                        }
                        aria-label={`${member.name} 的分攤金額`}
                      />
                    )}
                  </li>
                );
              })}
            </ul>

            {splitType === "even" && (
              <p className="text-xs text-muted-foreground">
                均分至小數第二位，除不盡的尾差（0.01）依加入旅程的先後順序分配給前幾位參與者。
              </p>
            )}

            {customSummary && (
              <p
                className={`text-xs ${customSummary.diff === 0 ? "text-muted-foreground" : "text-destructive"}`}
              >
                已分攤 {formatYen(customSummary.sum)}
                {customSummary.diff !== 0 &&
                  `，${customSummary.diff > 0 ? "尚有" : "超出"} ${formatYen(Math.abs(customSummary.diff))} 未對平，分攤總和必須等於開支金額`}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "儲存中…" : "儲存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
