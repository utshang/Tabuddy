"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Route } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addTransport } from "@/lib/actions/transports";
import {
  addTransportSchema,
  type AddTransportFormValues,
} from "@/lib/validations/transports";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TRANSPORT_MODE_PRESETS } from "@/lib/transport-modes";
import { applyTransportEvent, type CachedDay } from "@/lib/itinerary-cache";
import { itineraryQueryKey } from "@/lib/queries/itinerary";

const CUSTOM_OPTION = "__custom__";

export function AddTransportDialog({
  tripId,
  activityId,
}: {
  tripId: number;
  activityId: number;
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [modeOption, setModeOption] = useState<string>(
    TRANSPORT_MODE_PRESETS[0].value,
  );
  const queryClient = useQueryClient();
  const queryKey = itineraryQueryKey(tripId);
  const formRef = useRef<HTMLFormElement>(null);
  const isCustomMode = modeOption === CUSTOM_OPTION;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddTransportFormValues>({
    resolver: zodResolver(addTransportSchema),
    defaultValues: {
      after_activity_id: activityId,
      hours: 0,
      minutes: 0,
      mode: TRANSPORT_MODE_PRESETS[0].value,
      icon: undefined,
    },
  });

  function resetForm() {
    setModeOption(TRANSPORT_MODE_PRESETS[0].value);
    formRef.current?.reset();
    reset({
      after_activity_id: activityId,
      hours: 0,
      minutes: 0,
      mode: TRANSPORT_MODE_PRESETS[0].value,
      icon: undefined,
    });
  }

  function handleModeOptionChange(next: string) {
    setModeOption(next);
    if (next === CUSTOM_OPTION) {
      // 交通工具名稱為必填：切換為自訂時清空，待使用者輸入
      setValue("mode", "", { shouldValidate: true });
      setValue("icon", undefined);
    } else {
      setValue("mode", next, { shouldValidate: true });
      setValue("icon", undefined);
    }
  }

  // Rule: 成功新增後交通時間出現在對應行程之後
  // 新增的 id 由 server 產生，故在 onSuccess 用 server 回傳的實際資料寫入 cache，而非 onMutate 樂觀更新
  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await addTransport({}, formData);
      if (result.error) throw new Error(result.error);
      return result.transport!;
    },
    onSuccess: (transport) => {
      queryClient.setQueryData<CachedDay[]>(queryKey, (days) =>
        days ? applyTransportEvent(days, "INSERT", transport) : days,
      );
      toast.success("交通時間新增成功");
      resetForm();
      setOpen(false);
    },
    onError: (error) => {
      setServerError(error instanceof Error ? error.message : "新增交通時間失敗");
    },
  });

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
      <DialogTrigger render={<Button variant="ghost" size="sm" />}>
        <Route />
        新增交通時間
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增交通時間</DialogTitle>
          <DialogDescription>
            選擇交通工具，並填寫所需的時與分。
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
              <Label htmlFor="hours">時</Label>
              <Input
                id="hours"
                type="number"
                min={0}
                placeholder="0"
                {...register("hours")}
              />
              {errors.hours && (
                <p className="text-sm text-destructive">
                  {errors.hours.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="minutes">分</Label>
              <Input
                id="minutes"
                type="number"
                min={0}
                max={59}
                placeholder="0"
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
            <Label htmlFor="mode_option">交通工具</Label>
            <select
              id="mode_option"
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
                <Label htmlFor="mode">自訂交通工具名稱</Label>
                <Input
                  id="mode"
                  type="text"
                  placeholder="腳踏車"
                  {...register("mode")}
                />
                {errors.mode && (
                  <p className="text-sm text-destructive">
                    {errors.mode.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="icon">圖示（選填）</Label>
                <Input
                  id="icon"
                  type="text"
                  placeholder="🚲"
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
              {mutation.isPending ? "新增中…" : "新增交通時間"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
