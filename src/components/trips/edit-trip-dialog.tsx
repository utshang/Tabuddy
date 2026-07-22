'use client'

import { useRef, useState, useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { editTrip } from '@/lib/actions/trips'
import { editTripSchema, type EditTripFormValues } from '@/lib/validations/trips'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputDate } from '@/components/ui/input-date'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { formatDateValue, parseDateValue } from '@/lib/date'

type Trip = {
  id: number
  name: string
  start_date: string
  end_date: string
}

export function EditTripDialog({
  trip,
  open,
  onOpenChange,
}: {
  trip: Trip
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [serverError, setServerError] = useState<string>()
  const [confirmState, setConfirmState] = useState<{ affectedDates: string[] } | null>(null)
  const [isPending, startTransition] = useTransition()
  const pendingValuesRef = useRef<EditTripFormValues | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<EditTripFormValues>({
    resolver: zodResolver(editTripSchema),
    values: {
      name: trip.name,
      start_date: trip.start_date,
      end_date: trip.end_date,
    },
  })

  const startDate = useWatch({ control, name: 'start_date' })
  const endDate = useWatch({ control, name: 'end_date' })

  function submitEdit(values: EditTripFormValues, confirmDeletion: boolean) {
    setServerError(undefined)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('trip_id', String(trip.id))
      formData.set('name', values.name)
      formData.set('start_date', values.start_date)
      formData.set('end_date', values.end_date)
      formData.set('confirm_deletion', confirmDeletion ? 'true' : 'false')

      const result = await editTrip({}, formData)

      // Rule: 縮減起迄日範圍且範圍外的旅程日期包含行程時，系統須經使用者確認才會刪除
      if (result.requiresConfirmation) {
        pendingValuesRef.current = values
        setConfirmState({ affectedDates: result.affectedDates ?? [] })
        return
      }

      if (result.error) {
        setServerError(result.error)
        return
      }

      toast.success('旅程已更新')
      setConfirmState(null)
      onOpenChange(false)
    })
  }

  const onSubmit = handleSubmit((values) => submitEdit(values, false))

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) {
          reset()
          setServerError(undefined)
          setConfirmState(null)
        }
      }}
    >
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
                  pendingValuesRef.current && submitEdit(pendingValuesRef.current, true)
                }
                disabled={isPending}
              >
                {isPending ? '刪除中…' : '確認刪除'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>編輯旅程</DialogTitle>
              <DialogDescription>修改旅程名稱或起迄日。</DialogDescription>
            </DialogHeader>

            <form onSubmit={onSubmit} className="space-y-4">
              {serverError && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {serverError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`edit-name-${trip.id}`}>旅程名稱</Label>
                <Input id={`edit-name-${trip.id}`} type="text" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`edit-start-${trip.id}`}>起日</Label>
                  <InputDate
                    id={`edit-start-${trip.id}`}
                    date={startDate ? parseDateValue(startDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setValue('start_date', formatDateValue(date), { shouldValidate: true })
                      }
                    }}
                  />
                  {errors.start_date && (
                    <p className="text-sm text-destructive">{errors.start_date.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`edit-end-${trip.id}`}>迄日</Label>
                  <InputDate
                    id={`edit-end-${trip.id}`}
                    date={endDate ? parseDateValue(endDate) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setValue('end_date', formatDateValue(date), { shouldValidate: true })
                      }
                    }}
                  />
                  {errors.end_date && (
                    <p className="text-sm text-destructive">{errors.end_date.message}</p>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isPending}>
                  {isPending ? '儲存中…' : '儲存'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
