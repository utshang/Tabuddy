"use client"

import { useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { editTransport } from "@/lib/actions/transports"
import {
  editTransportSchema,
  type EditTransportFormValues,
} from "@/lib/validations/transports"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { TRANSPORT_MODE_PRESETS, isPresetMode } from "@/lib/transport-modes"
import { applyTransportEvent, type CachedDay, type CachedTransport } from "@/lib/itinerary-cache"
import { itineraryQueryKey } from "@/lib/queries/itinerary"

const CUSTOM_OPTION = "__custom__"

export function EditTransportDialog({
  activityId,
  transport,
  open,
  onOpenChange,
}: {
  activityId: number
  transport: CachedTransport
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [serverError, setServerError] = useState<string>()
  const queryClient = useQueryClient()
  const queryKey = itineraryQueryKey(transport.trip_id)
  const initialModeOption = isPresetMode(transport.mode)
    ? transport.mode
    : CUSTOM_OPTION
  const [modeOption, setModeOption] = useState<string>(initialModeOption)
  const formRef = useRef<HTMLFormElement>(null)
  const isCustomMode = modeOption === CUSTOM_OPTION

  const initialValues: EditTransportFormValues = {
    after_activity_id: activityId,
    hours: transport.hours,
    minutes: transport.minutes,
    mode: transport.mode,
    icon: transport.icon ?? undefined,
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditTransportFormValues>({
    resolver: zodResolver(editTransportSchema),
    defaultValues: initialValues,
  })

  function resetForm() {
    setModeOption(initialModeOption)
    formRef.current?.reset()
    reset(initialValues)
  }

  function handleModeOptionChange(next: string) {
    setModeOption(next)
    if (next === CUSTOM_OPTION) {
      // 切換回原本的自訂交通工具時還原原值；否則清空待使用者輸入
      if (initialModeOption === CUSTOM_OPTION) {
        setValue("mode", transport.mode, { shouldValidate: true })
        setValue("icon", transport.icon ?? undefined)
      } else {
        setValue("mode", "", { shouldValidate: true })
        setValue("icon", undefined)
      }
    } else {
      // Rule: 交通工具改為預設選項時圖示自動清除（前端先清空，後端亦強制）
      setValue("mode", next, { shouldValidate: true })
      setValue("icon", undefined)
    }
  }

  // Rule: 編輯交通時間可同時修改任意欄位組合
  // 圖示是否清除的規則在 server 端 resolveEditedTransportIcon 判斷，故在 onSuccess 用 server 回傳的實際資料寫入 cache，而非在前端複製一份判斷邏輯
  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await editTransport({}, formData)
      if (result.error) throw new Error(result.error)
      return result.transport!
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<CachedDay[]>(queryKey, (days) =>
        days ? applyTransportEvent(days, "UPDATE", updated) : days,
      )
      toast.success("交通時間已更新")
      onOpenChange(false)
    },
    onError: (error) => {
      setServerError(error instanceof Error ? error.message : "編輯交通時間失敗")
    },
  })

  const onSubmit = handleSubmit(() => {
    setServerError(undefined)
    mutation.mutate(new FormData(formRef.current!))
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          resetForm()
          setServerError(undefined)
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯交通時間</DialogTitle>
          <DialogDescription>
            修改交通工具，或所需的時與分。
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <input type="hidden" {...register("after_activity_id")} />

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-transport-hours-${activityId}`}>時</Label>
              <Input
                id={`edit-transport-hours-${activityId}`}
                type="number"
                min={0}
                {...register("hours")}
              />
              {errors.hours && (
                <p className="text-sm text-destructive">
                  {errors.hours.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-transport-minutes-${activityId}`}>
                分
              </Label>
              <Input
                id={`edit-transport-minutes-${activityId}`}
                type="number"
                min={0}
                max={59}
                {...register("minutes")}
              />
              {errors.minutes && (
                <p className="text-sm text-destructive">
                  {errors.minutes.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-transport-mode-option-${activityId}`}>
              交通工具
            </Label>
            <select
              id={`edit-transport-mode-option-${activityId}`}
              value={modeOption}
              onChange={(e) => handleModeOptionChange(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {TRANSPORT_MODE_PRESETS.map((preset) => (
                <option key={preset.value} value={preset.value}>
                  {preset.icon} {preset.value}
                </option>
              ))}
              <option value={CUSTOM_OPTION}>✏️ 自訂交通工具…</option>
            </select>
          </div>

          {!isCustomMode && (
            <>
              <input type="hidden" {...register("mode")} />
              <input type="hidden" {...register("icon")} />
            </>
          )}

          {isCustomMode && (
            <>
              <div className="space-y-2">
                <Label htmlFor={`edit-transport-mode-${activityId}`}>
                  自訂交通工具名稱
                </Label>
                <Input
                  id={`edit-transport-mode-${activityId}`}
                  type="text"
                  {...register("mode")}
                />
                {errors.mode && (
                  <p className="text-sm text-destructive">
                    {errors.mode.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor={`edit-transport-icon-${activityId}`}>
                  圖示（選填）
                </Label>
                <Input
                  id={`edit-transport-icon-${activityId}`}
                  type="text"
                  {...register("icon")}
                />
                <p className="text-xs text-muted-foreground">
                  未填寫時將以名稱文字顯示代替
                </p>
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "儲存中…" : "儲存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
