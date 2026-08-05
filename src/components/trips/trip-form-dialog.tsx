"use client";

import { useRef, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createTrip, editTrip } from "@/lib/actions/trips";
import {
  editTripSchema,
  type EditTripFormValues,
} from "@/lib/validations/trips";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDateValue, parseDateValue } from "@/lib/date";

type Trip = {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
};

type TripFormDialogProps =
  | { mode: "create" }
  | {
      mode: "edit";
      trip: Trip;
      open: boolean;
      onOpenChange: (open: boolean) => void;
    };

// 新增與編輯旅程共用同一組欄位（名稱、起迄日），差異只在送出的 server action；
// 編輯旅程另有「縮減範圍且範圍內有行程時需二次確認」的流程，為 edit 模式特有。
export function TripFormDialog(props: TripFormDialogProps) {
  const isEdit = props.mode === "edit";
  const trip = isEdit ? props.trip : undefined;
  const idSuffix = isEdit ? `-${trip!.id}` : "";

  const [internalOpen, setInternalOpen] = useState(false);
  const open = isEdit ? props.open : internalOpen;
  const setOpen = isEdit ? props.onOpenChange : setInternalOpen;

  const [serverError, setServerError] = useState<string>();
  const [confirmState, setConfirmState] = useState<{
    affectedDates: string[];
  } | null>(null);
  const [isPending, startTransition] = useTransition();
  const pendingValuesRef = useRef<EditTripFormValues | null>(null);

  const defaultValues: EditTripFormValues | undefined = isEdit
    ? { name: trip!.name, start_date: trip!.start_date, end_date: trip!.end_date }
    : undefined;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<EditTripFormValues>({
    resolver: zodResolver(editTripSchema),
    values: isEdit ? defaultValues : undefined,
  });

  const startDate = useWatch({ control, name: "start_date" });
  const endDate = useWatch({ control, name: "end_date" });

  function submitForm(values: EditTripFormValues, confirmDeletion: boolean) {
    setServerError(undefined);
    startTransition(async () => {
      if (isEdit) {
        const formData = new FormData();
        formData.set("trip_id", String(trip!.id));
        formData.set("name", values.name);
        formData.set("start_date", values.start_date);
        formData.set("end_date", values.end_date);
        formData.set("confirm_deletion", confirmDeletion ? "true" : "false");

        const result = await editTrip({}, formData);

        // Rule: 縮減起迄日範圍且範圍外的旅程日期包含行程時，系統須經使用者確認才會刪除
        if (result.requiresConfirmation) {
          pendingValuesRef.current = values;
          setConfirmState({ affectedDates: result.affectedDates ?? [] });
          return;
        }

        if (result.error) {
          setServerError(result.error);
          return;
        }

        toast.success("旅程已更新");
        setConfirmState(null);
        setOpen(false);
        return;
      }

      const formData = new FormData();
      formData.set("name", values.name);
      formData.set("start_date", values.start_date);
      formData.set("end_date", values.end_date);

      const result = await createTrip({}, formData);

      if (result.error) {
        setServerError(result.error);
        return;
      }

      toast.success("旅程建立成功");
      reset();
      setOpen(false);
    });
  }

  const onSubmit = handleSubmit((values) => submitForm(values, false));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          reset(defaultValues);
          setServerError(undefined);
          setConfirmState(null);
        }
      }}
    >
      {!isEdit && <DialogTrigger render={<Button />}>新增旅程</DialogTrigger>}
      <DialogContent>
        {confirmState ? (
          <>
            <DialogHeader>
              <DialogTitle>確定要刪除受影響的行程嗎？</DialogTitle>
              <DialogDescription>
                縮減後的旅程範圍不包含以下日期，這些日期底下已經安排了行程，確認後將連同行程一併刪除，且無法復原。
              </DialogDescription>
            </DialogHeader>

            <ul className="text-sm space-y-1">
              {confirmState.affectedDates.map((date) => (
                <li key={date}>{date}</li>
              ))}
            </ul>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setConfirmState(null)}
                disabled={isPending}
              >
                取消
              </Button>
              {/* Rule: 使用者確認後刪除範圍外的旅程日期與行程 */}
              <Button
                onClick={() =>
                  pendingValuesRef.current &&
                  submitForm(pendingValuesRef.current, true)
                }
                disabled={isPending}
              >
                {isPending ? "刪除中…" : "確認刪除"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{isEdit ? "編輯旅程" : "新增旅程"}</DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "修改旅程名稱或起迄日。"
                  : "輸入旅程名稱與起迄日，建立後即可開始規劃行程。"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="space-y-4">
              {serverError && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {serverError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`trip-name${idSuffix}`}>旅程名稱</Label>
                <Input
                  id={`trip-name${idSuffix}`}
                  type="text"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`trip-start${idSuffix}`}>起日</Label>
                  <InputDate
                    id={`trip-start${idSuffix}`}
                    date={startDate ? parseDateValue(startDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setValue("start_date", formatDateValue(date), {
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                  {errors.start_date && (
                    <p className="text-sm text-destructive">
                      {errors.start_date.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`trip-end${idSuffix}`}>迄日</Label>
                  <InputDate
                    id={`trip-end${idSuffix}`}
                    date={endDate ? parseDateValue(endDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setValue("end_date", formatDateValue(date), {
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                  {errors.end_date && (
                    <p className="text-sm text-destructive">
                      {errors.end_date.message}
                    </p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isEdit
                    ? isPending
                      ? "儲存中…"
                      : "儲存"
                    : isPending
                      ? "建立中…"
                      : "建立旅程"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
