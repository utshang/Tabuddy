"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Route } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addTransport, editTransport } from "@/lib/actions/transports";
import {
  editTransportSchema,
  type EditTransportFormValues,
} from "@/lib/validations/transports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputSelect } from "@/components/ui/input-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TRANSPORT_MODE_PRESETS, isPresetMode } from "@/lib/transport-modes";
import { applyTransportEvent, type CachedDay, type CachedTransport } from "@/lib/itinerary-cache";
import { itineraryQueryKey } from "@/lib/queries/itinerary";

const CUSTOM_OPTION = "__custom__";

type TransportFormDialogProps =
  | { mode: "create"; tripId: number; activityId: number }
  | {
      mode: "edit";
      activityId: number;
      transport: CachedTransport;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    };

// 新增與編輯交通時間共用同一組欄位（時、分、交通工具），差異只在送出的 server action
// 與成功後的 cache 更新方式，故合併成單一元件、以 mode 區分。
export function TransportFormDialog(props: TransportFormDialogProps) {
  const isEdit = props.mode === "edit";
  const transport = isEdit ? props.transport : undefined;
  const activityId = props.activityId;
  const tripId = isEdit ? props.transport.trip_id : props.tripId;
  const idPrefix = isEdit ? `edit-transport-${activityId}` : `transport-${activityId}`;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isEdit ? props.open : internalOpen;
  const setOpen = isEdit ? props.onOpenChange : setInternalOpen;

  const initialModeOption =
    isEdit && transport
      ? isPresetMode(transport.mode)
        ? transport.mode
        : CUSTOM_OPTION
      : TRANSPORT_MODE_PRESETS[0].value;
  const [modeOption, setModeOption] = useState<string>(initialModeOption);
  const isCustomMode = modeOption === CUSTOM_OPTION;

  const [serverError, setServerError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const queryKey = itineraryQueryKey(tripId);

  const defaultValues: EditTransportFormValues = isEdit
    ? {
        after_activity_id: activityId,
        hours: transport!.hours,
        minutes: transport!.minutes,
        mode: transport!.mode,
        icon: transport!.icon ?? undefined,
      }
    : {
        after_activity_id: activityId,
        hours: 0,
        minutes: 0,
        mode: TRANSPORT_MODE_PRESETS[0].value,
        icon: undefined,
      };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<EditTransportFormValues>({
    resolver: zodResolver(editTransportSchema),
    defaultValues,
  });

  function resetForm() {
    setModeOption(initialModeOption);
    formRef.current?.reset();
    reset(defaultValues);
  }

  function handleModeOptionChange(next: string) {
    setModeOption(next);
    if (next === CUSTOM_OPTION) {
      // 切換回原本的自訂交通工具時還原原值；否則清空待使用者輸入
      if (isEdit && initialModeOption === CUSTOM_OPTION) {
        setValue("mode", transport!.mode, { shouldValidate: true });
        setValue("icon", transport!.icon ?? undefined);
      } else {
        setValue("mode", "", { shouldValidate: true });
        setValue("icon", undefined);
      }
    } else {
      // Rule: 交通工具改為預設選項時圖示自動清除（前端先清空，後端亦強制）
      setValue("mode", next, { shouldValidate: true });
      setValue("icon", undefined);
    }
  }

  // Rule: 成功新增後交通時間出現在對應行程之後
  // 新增的 id 由 server 產生，故在 onSuccess 用 server 回傳的實際資料寫入 cache，而非 onMutate 樂觀更新
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await addTransport({}, formData);
      if (result.error) throw new Error(result.error);
      return result.transport!;
    },
    onSuccess: (created) => {
      queryClient.setQueryData<CachedDay[]>(queryKey, (days) =>
        days ? applyTransportEvent(days, "INSERT", created) : days,
      );
      toast.success("交通時間新增成功");
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      setServerError(error instanceof Error ? error.message : "新增交通時間失敗");
    },
  });

  // Rule: 編輯交通時間可同時修改任意欄位組合
  // 圖示是否清除的規則在 server 端 resolveEditedTransportIcon 判斷，故在 onSuccess 用 server 回傳的實際資料寫入 cache，而非在前端複製一份判斷邏輯
  const editMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await editTransport({}, formData);
      if (result.error) throw new Error(result.error);
      return result.transport!;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData<CachedDay[]>(queryKey, (days) =>
        days ? applyTransportEvent(days, "UPDATE", updated) : days,
      );
      toast.success("交通時間已更新");
      setOpen(false);
    },
    onError: (error) => {
      setServerError(error instanceof Error ? error.message : "編輯交通時間失敗");
    },
  });

  const mutation = isEdit ? editMutation : createMutation;

  const onSubmit = handleSubmit(() => {
    setServerError(undefined);
    mutation.mutate(new FormData(formRef.current!));
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          resetForm();
          setServerError(undefined);
        }
      }}
    >
      {!isEdit && (
        <DialogTrigger render={<Button variant="ghost" size="sm" />}>
          <Route />
          新增交通時間
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯交通時間" : "新增交通時間"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "修改交通工具，或所需的時與分。"
              : "選擇交通工具，並填寫所需的時與分。"}
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
              <Label htmlFor={`${idPrefix}-hours`}>時</Label>
              <Input
                id={`${idPrefix}-hours`}
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
              <Label htmlFor={`${idPrefix}-minutes`}>分</Label>
              <Input
                id={`${idPrefix}-minutes`}
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
            <Label htmlFor={`${idPrefix}-mode-option`}>交通工具</Label>
            <InputSelect
              id={`${idPrefix}-mode-option`}
              value={modeOption}
              onValueChange={handleModeOptionChange}
              options={[
                ...TRANSPORT_MODE_PRESETS.map((preset) => ({
                  value: preset.value,
                  label: `${preset.icon} ${preset.value}`,
                })),
                { value: CUSTOM_OPTION, label: "✏️ 自訂交通工具…" },
              ]}
            />
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
                <Label htmlFor={`${idPrefix}-mode`}>自訂交通工具名稱</Label>
                <Input
                  id={`${idPrefix}-mode`}
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
                <Label htmlFor={`${idPrefix}-icon`}>圖示（選填）</Label>
                <Input
                  id={`${idPrefix}-icon`}
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
              {isEdit
                ? mutation.isPending
                  ? "儲存中…"
                  : "儲存"
                : mutation.isPending
                  ? "新增中…"
                  : "新增交通時間"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
