"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import { setDayStartTime } from "@/lib/actions/days";
import {
  setDayStartTimeSchema,
  type SetDayStartTimeFormValues,
} from "@/lib/validations/days";
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

export function DayStartTimeDialog({
  dayId,
  startTime,
}: {
  dayId: number;
  startTime: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SetDayStartTimeFormValues>({
    resolver: zodResolver(setDayStartTimeSchema),
    values: { day_id: dayId, start_time: startTime ?? "" },
  });

  const onSubmit = handleSubmit(() => {
    setServerError(undefined);
    startTransition(async () => {
      const result = await setDayStartTime({}, new FormData(formRef.current!));

      if (result.error) {
        setServerError(result.error);
        return;
      }

      toast.success("開始時間已更新");
      setOpen(false);
    });
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          formRef.current?.reset();
          reset();
          setServerError(undefined);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="sm"
            className="h-auto px-0 py-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          />
        }
      >
        <Clock />
        {startTime ? `出發時間：${startTime}` : "設定開始時間"}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>設定當日開始時間</DialogTitle>
          <DialogDescription>設定這一天行程的開始時間。</DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <input type="hidden" {...register("day_id")} />

          <div className="space-y-2">
            <Label htmlFor={`day-start-time-${dayId}`}>開始時間</Label>
            <Input
              id={`day-start-time-${dayId}`}
              type="time"
              {...register("start_time")}
            />
            {errors.start_time && (
              <p className="text-sm text-destructive">
                {errors.start_time.message}
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
