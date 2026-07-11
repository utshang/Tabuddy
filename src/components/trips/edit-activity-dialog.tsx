"use client";

import { useRef, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
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
  DialogTrigger,
} from "@/components/ui/dialog";

type Activity = {
  id: number;
  name: string;
  google_map_url: string | null;
  duration_minutes: number;
  note: string | null;
};

export function EditActivityDialog({ activity }: { activity: Activity }) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

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
    },
  });

  const onSubmit = handleSubmit(() => {
    setServerError(undefined);
    startTransition(async () => {
      const formData = new FormData(formRef.current!);
      formData.set("activity_id", String(activity.id));

      const result = await editActivity({}, formData);

      if (result.error) {
        setServerError(result.error);
        return;
      }

      toast.success("行程已更新");
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
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Pencil />
        <span className="sr-only">編輯行程</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>編輯行程</DialogTitle>
          <DialogDescription>
            修改行程名稱、GoogleMap 連結、停留時間或備註。
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
            <Label htmlFor={`edit-activity-duration-${activity.id}`}>
              停留時間（分鐘）
            </Label>
            <Input
              id={`edit-activity-duration-${activity.id}`}
              type="number"
              min={1}
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
