"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editActivity } from "@/lib/actions/activities";
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

export function EditActivityDialog({
  activity,
  open,
  onOpenChange,
}: {
  activity: Activity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [serverError, setServerError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const queryKey = itineraryQueryKey(activity.trip_id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditActivityFormValues>({
    resolver: zodResolver(editActivitySchema),
    values: {
      name: activity.name,
      google_map_url: activity.google_map_url ?? "",
      duration_minutes: activity.duration_minutes,
      note: activity.note ?? "",
      fixed_time: activity.fixed_time ?? "",
    },
  });

  // Rule: 編輯行程可同時修改任意欄位組合（樂觀更新，失敗時回滾）
  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      formData.set("activity_id", String(activity.id));
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
              id: activity.id,
              day_id: activity.day_id,
              trip_id: activity.trip_id,
              order: activity.order,
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
      onOpenChange(false);
    },
    onError: (error, _formData, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      setServerError(error instanceof Error ? error.message : "編輯行程失敗");
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
        onOpenChange(next);
        if (!next) {
          formRef.current?.reset();
          reset();
          setServerError(undefined);
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯行程</DialogTitle>
          <DialogDescription>
            修改行程名稱、GoogleMap 連結、停留時間、備註或指定時間。
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor={`edit-activity-name-${activity.id}`}>
              行程名稱
            </Label>
            <Input
              id={`edit-activity-name-${activity.id}`}
              type="text"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-activity-url-${activity.id}`}>
              GoogleMap 連結
            </Label>
            <Input
              id={`edit-activity-url-${activity.id}`}
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
            <Label htmlFor={`edit-activity-duration-${activity.id}`}>
              停留時間（分鐘）
            </Label>
            <Input
              id={`edit-activity-duration-${activity.id}`}
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
            <Label htmlFor={`edit-activity-note-${activity.id}`}>備註</Label>
            <Textarea
              id={`edit-activity-note-${activity.id}`}
              {...register("note")}
            />
            {errors.note && (
              <p className="text-sm text-destructive">{errors.note.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-activity-fixed-time-${activity.id}`}>
              指定時間
            </Label>
            <Input
              id={`edit-activity-fixed-time-${activity.id}`}
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
              {mutation.isPending ? "儲存中…" : "儲存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
