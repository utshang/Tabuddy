"use client"

import { useMemo, useRef, useState, useTransition } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { addExpense } from "@/lib/actions/expenses"
import {
  addExpenseFormSchema,
  type AddExpenseFormValues,
} from "@/lib/validations/expenses"
import { EXPENSE_CATEGORY_PRESETS } from "@/lib/expense-categories"
import { splitEvenly } from "@/lib/expense-split"
import { formatYen } from "@/lib/currency"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { InputDate } from "@/components/ui/input-date"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { formatDateValue, localToday, parseDateValue } from "@/lib/date"

const CUSTOM_OPTION = "__custom__"

export type ExpenseMember = {
  /** 依加入旅程的先後順序排列 */
  id: string
  name: string
  isMe: boolean
}

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"

export function AddExpenseDialog({
  tripId,
  members,
}: {
  tripId: number
  members: ExpenseMember[]
}) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string>()
  const [isPending, startTransition] = useTransition()
  const [categoryOption, setCategoryOption] = useState<string>(
    EXPENSE_CATEGORY_PRESETS[0].value,
  )
  const [checked, setChecked] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(members.map((m) => [m.id, true])),
  )
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(
    {},
  )
  const formRef = useRef<HTMLFormElement>(null)
  const isCustomCategory = categoryOption === CUSTOM_OPTION
  const me = members.find((m) => m.isMe)

  const defaultValues: AddExpenseFormValues = useMemo(
    () => ({
      trip_id: tripId,
      name: "",
      amount: "",
      category: EXPENSE_CATEGORY_PRESETS[0].value,
      category_icon: undefined,
      payer_id: me?.id ?? "",
      expense_date: "",
      split_type: "even",
    }),
    [tripId, me?.id],
  )

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<AddExpenseFormValues>({
    resolver: zodResolver(addExpenseFormSchema),
    defaultValues,
  })

  const splitType = useWatch({ control, name: "split_type" })
  const watchedAmount = Number(useWatch({ control, name: "amount" }))
  const expenseDate = useWatch({ control, name: "expense_date" }) as
    | string
    | undefined

  const checkedMembers = members.filter((m) => checked[m.id])

  // Rule: 均分時金額平均分配至小數第二位，尾差以 0.01 依參與者加入旅程的先後順序分配給前幾位參與者
  // members 已依加入順序排列，此處即時預覽每位參與者的分攤金額（與 server 端計算共用同一純函式）
  const evenShares = (() => {
    if (splitType !== "even" || checkedMembers.length === 0) return null
    try {
      const shares = splitEvenly(watchedAmount, checkedMembers.length)
      return Object.fromEntries(
        checkedMembers.map((m, i) => [m.id, shares[i]]),
      ) as Record<string, number>
    } catch {
      return null
    }
  })()

  // Rule: 自訂金額時各參與者分攤金額之和必須等於開支金額（即時顯示差額）
  const customSummary = (() => {
    if (splitType !== "custom") return null
    // 把所有勾選的參與者各自填的自訂分攤金額逐一 × 100 加總起來，同樣以分為單位
    const sumCents = checkedMembers.reduce((sum, m) => {
      const value = Number(customAmounts[m.id] ?? "")
      if (!Number.isFinite(value)) return sum
      return sum + Math.round(value * 100)
    }, 0)
    // 使用者在「金額」欄位輸入的開支總額，換算成分。例如輸入 350.5 元 → 35050
    const amountCents = Number.isFinite(watchedAmount)
      ? Math.round(watchedAmount * 100)
      : 0
    // 自訂金額時各參與者分攤金額之和必須等於開支金額
    return { sum: sumCents / 100, diff: (amountCents - sumCents) / 100 }
  })()

  function resetForm() {
    setCategoryOption(EXPENSE_CATEGORY_PRESETS[0].value)
    setChecked(Object.fromEntries(members.map((m) => [m.id, true])))
    setCustomAmounts({})
    formRef.current?.reset()
    reset(defaultValues)
  }

  function handleCategoryOptionChange(next: string) {
    setCategoryOption(next)
    if (next === CUSTOM_OPTION) {
      // 類別為必填：切換為自定義時清空，待使用者輸入類別名稱
      setValue("category", "", { shouldValidate: true })
      setValue("category_icon", undefined)
    } else {
      // 圖示僅適用於自定義類別：改回預設選項時清空
      setValue("category", next, { shouldValidate: true })
      setValue("category_icon", undefined)
    }
  }

  const onSubmit = handleSubmit(() => {
    // Rule: 參與分攤的團員至少一人（client 端先擋，server 端仍會驗證）
    if (checkedMembers.length === 0) {
      setServerError("參與分攤的團員至少一人")
      return
    }

    setServerError(undefined)
    startTransition(async () => {
      const result = await addExpense({}, new FormData(formRef.current!))

      if (result.error) {
        setServerError(result.error)
        return
      }

      toast.success("開支新增成功")
      resetForm()
      setOpen(false)
    })
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          // Rule: 開支日期未指定時預設為當天（以使用者裝置時區帶入預設值）
          setValue("expense_date", localToday())
        } else {
          resetForm()
          setServerError(undefined)
        }
      }}
    >
      <DialogTrigger
        render={
          <Button className="h-auto flex-col gap-1 rounded-xl px-6 py-3" />
        }
      >
        <Plus className="size-5" />
        新增開支
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>新增開支</DialogTitle>
          <DialogDescription>
            填寫品項、金額、類別與付款人，並選擇分攤方式。
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <input type="hidden" {...register("trip_id")} />
          <div className="space-y-2">
            <Label htmlFor="expense-name">標題</Label>
            <Input
              id="expense-name"
              type="text"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="category_option">類別</Label>
            <select
              id="category_option"
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
                <Label htmlFor="expense-category">類別名稱</Label>
                <Input
                  id="expense-category"
                  type="text"
                  {...register("category")}
                />
                {errors.category && (
                  <p className="text-sm text-destructive">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="expense-category-icon">圖示（選填）</Label>
                <Input
                  id="expense-category-icon"
                  type="text"
                  {...register("category_icon")}
                />
                <p className="text-xs text-muted-foreground">
                  未填寫時將以名稱文字顯示代替
                </p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="expense-amount">金額</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                ¥
              </span>
              <Input
                id="expense-amount"
                type="number"
                step="0.01"
                min="0.01"
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
              <Label htmlFor="expense-payer">支付者</Label>
              <select
                id="expense-payer"
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
              <Label htmlFor="expense-date">何時</Label>
              <input type="hidden" {...register("expense_date")} />
              <InputDate
                id="expense-date"
                date={expenseDate ? parseDateValue(expenseDate) : undefined}
                onSelect={(date) => {
                  if (date) {
                    setValue("expense_date", formatDateValue(date), {
                      shouldValidate: true,
                    })
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
                const isChecked = checked[member.id] ?? false
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
                )
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
              {isPending ? "新增中…" : "新增"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
