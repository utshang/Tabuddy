"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addActivity } from "@/lib/actions/activities";
import {
  addActivitySchema,
  type AddActivityFormValues,
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

export function AddActivityDialog({
  tripId,
  dayId,
}: {
  tripId: number;
  dayId: number;
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const formRef = useRef<HTMLFormElement>(null);
  const queryClient = useQueryClient();
  const queryKey = itineraryQueryKey(tripId);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddActivityFormValues>({
    resolver: zodResolver(addActivitySchema),
    defaultValues: { day_id: dayId },
  });

  // Rule: 成功新增後行程出現在對應旅程日期中
  // 新增的 id 由 server 產生，無法在送出前先假裝成功，故在 onSuccess 用 server 回傳的實際資料寫入 cache，
  // 而非 onMutate 樂觀更新；Realtime 事件之後送達同一筆資料時，applyActivityEvent 以 id 比對覆蓋，不會重複
  const mutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const result = await addActivity({}, formData);
      if (result.error) throw new Error(result.error);
      return result.activity!;
    },
    onSuccess: (activity) => {
      queryClient.setQueryData<CachedDay[]>(queryKey, (days) =>
        days ? applyActivityEvent(days, "INSERT", activity) : days,
      );
      toast.success("行程新增成功");
      formRef.current?.reset();
      reset({ day_id: dayId });
      setOpen(false);
    },
    onError: (error) => {
      setServerError(error instanceof Error ? error.message : "新增行程失敗");
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
          formRef.current?.reset();
          reset({ day_id: dayId });
          setServerError(undefined);
        }
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Plus />
        新增行程
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增行程</DialogTitle>
          <DialogDescription>
            輸入行程名稱與停留時間，選填 GoogleMap 連結與備註。
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <input type="hidden" {...register("day_id")} />

          <div className="space-y-2">
            <Label htmlFor="name">行程名稱</Label>
            <Input
              id="name"
              type="text"
              placeholder="道頓堀"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_map_url">GoogleMap 連結</Label>
            <Input
              id="google_map_url"
              type="text"
              placeholder="https://maps.google.com/..."
              {...register("google_map_url")}
            />
            {errors.google_map_url && (
              <p className="text-sm text-destructive">
                {errors.google_map_url.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_minutes">停留時間（分鐘）</Label>
            <Input
              id="duration_minutes"
              type="number"
              min={0}
              placeholder="30"
              {...register("duration_minutes")}
            />
            {errors.duration_minutes && (
              <p className="text-sm text-destructive">
                {errors.duration_minutes.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">備註</Label>
            <Textarea
              id="note"
              placeholder="推薦晚上去"
              {...register("note")}
            />
            {errors.note && (
              <p className="text-sm text-destructive">{errors.note.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "新增中…" : "新增行程"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
