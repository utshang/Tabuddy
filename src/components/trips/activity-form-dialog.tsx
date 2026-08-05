"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addActivity, editActivity } from "@/lib/actions/activities";
import {
  editActivitySchema,
  type EditActivityFormValues,
} from "@/lib/validations/activities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { applyActivityEvent, type CachedDay } from "@/lib/itinerary-cache";
import { itineraryQueryKey } from "@/lib/queries/itinerary";

type Activity = {
  id: number;
  day_id: number;
  trip_id: number;
  order: number;
  name: string;
  google_map_url: string | null;
  duration_minutes: number;
  note: string | null;
  fixed_time: string | null;
};

type ActivityFormDialogProps =
  | { mode: "create"; tripId: number; dayId: number }
  | {
      mode: "edit";
      activity: Activity;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    };

// 新增與編輯行程共用同一組欄位（名稱、GoogleMap 連結、停留時間、備註、指定時間），
// 差異只在送出的 server action 與成功後的 cache 更新方式，故合併成單一元件、以 mode 區分。
export function ActivityFormDialog(props: ActivityFormDialogProps) {
  const isEdit = props.mode === "edit";
  const activity = isEdit ? props.activity : undefined;
  const tripId = isEdit ? props.activity.trip_id : props.tripId;
  const dayId = isEdit ? props.activity.day_id : props.dayId;
  const idPrefix = isEdit ? `edit-activity-${activity!.id}` : `activity-${dayId}`;

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isEdit ? props.open : internalOpen;
  const setOpen = isEdit ? props.onOpenChange : setInternalOpen;

  const [serverError, setServerError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const queryKey = itineraryQueryKey(tripId);

  const defaultValues: EditActivityFormValues = isEdit
    ? {
        name: props.activity.name,
        google_map_url: props.activity.google_map_url ?? "",
        duration_minutes: props.activity.duration_minutes,
        note: props.activity.note ?? "",
        fixed_time: props.activity.fixed_time ?? "",
      }
    : {
        name: "",
        google_map_url: "",
        duration_minutes: 0,
        note: "",
        fixed_time: "",
      };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditActivityFormValues>({
    resolver: zodResolver(editActivitySchema),
    values: isEdit ? defaultValues : undefined,
    defaultValues: isEdit ? undefined : defaultValues,
  });

  // Rule: 成功新增後行程出現在對應旅程日期中
  // 新增的 id 由 server 產生，無法在送出前先假裝成功，故在 onSuccess 用 server 回傳的實際資料寫入 cache，
  // 而非 onMutate 樂觀更新；Realtime 事件之後送達同一筆資料時，applyActivityEvent 以 id 比對覆蓋，不會重複
  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await addActivity({}, formData);
      if (result.error) throw new Error(result.error);
      return result.activity!;
    },
    onSuccess: (created) => {
      queryClient.setQueryData<CachedDay[]>(queryKey, (days) =>
        days ? applyActivityEvent(days, "INSERT", created) : days,
      );
      toast.success("行程新增成功");
      formRef.current?.reset();
      reset(defaultValues);
      setOpen(false);
    },
    onError: (error) => {
      setServerError(error instanceof Error ? error.message : "新增行程失敗");
    },
  });

  // Rule: 編輯行程可同時修改任意欄位組合（樂觀更新，失敗時回滾）
  const editMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      formData.set("activity_id", String(activity!.id));
      const result = await editActivity({}, formData);
      if (result.error) throw new Error(result.error);
    },
    onMutate: async (formData) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CachedDay[]>(queryKey);
      const googleMapUrl = String(formData.get("google_map_url") ?? "");
      const note = String(formData.get("note") ?? "");
      const fixedTime = String(formData.get("fixed_time") ?? "");
      queryClient.setQueryData<CachedDay[]>(queryKey, (days) =>
        days
          ? applyActivityEvent(days, "UPDATE", {
              id: activity!.id,
              day_id: activity!.day_id,
              trip_id: activity!.trip_id,
              order: activity!.order,
              name: String(formData.get("name") ?? ""),
              google_map_url: googleMapUrl || null,
              duration_minutes: Number(formData.get("duration_minutes")),
              note: note || null,
              fixed_time: fixedTime || null,
            })
          : days,
      );
      return { previous };
    },
    onSuccess: () => {
      toast.success("行程已更新");
      setOpen(false);
    },
    onError: (error, _formData, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      setServerError(error instanceof Error ? error.message : "編輯行程失敗");
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
          formRef.current?.reset();
          reset(defaultValues);
          setServerError(undefined);
        }
      }}
    >
      {!isEdit && (
        <DialogTrigger render={<Button variant="outline" size="sm" />}>
          <Plus />
          新增行程
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "編輯行程" : "新增行程"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "修改行程名稱、GoogleMap 連結、停留時間、備註或指定時間。"
              : "輸入行程名稱與停留時間，選填 GoogleMap 連結、備註與指定時間。"}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          {!isEdit && <input type="hidden" name="day_id" defaultValue={dayId} />}

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-name`}>行程名稱</Label>
            <Input id={`${idPrefix}-name`} type="text" {...register("name")} />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-url`}>GoogleMap 連結</Label>
            <Input
              id={`${idPrefix}-url`}
              type="text"
              {...register("google_map_url")}
            />
            {errors.google_map_url && (
              <p className="text-sm text-destructive">
                {errors.google_map_url.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-duration`}>停留時間（分鐘）</Label>
            <Input
              id={`${idPrefix}-duration`}
              type="number"
              min={0}
              {...register("duration_minutes")}
            />
            {errors.duration_minutes && (
              <p className="text-sm text-destructive">
                {errors.duration_minutes.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-note`}>備註</Label>
            <Textarea id={`${idPrefix}-note`} {...register("note")} />
            {errors.note && (
              <p className="text-sm text-destructive">{errors.note.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}-fixed-time`}>指定時間</Label>
            <Input
              id={`${idPrefix}-fixed-time`}
              type="time"
              {...register("fixed_time")}
            />
            {errors.fixed_time && (
              <p className="text-sm text-destructive">
                {errors.fixed_time.message}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {isEdit
                ? mutation.isPending
                  ? "儲存中…"
                  : "儲存"
                : mutation.isPending
                  ? "新增中…"
                  : "新增行程"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
