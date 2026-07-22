'use client'

import { useRef, useState, useTransition } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createTrip } from '@/lib/actions/trips'
import { createTripSchema, type CreateTripFormValues } from '@/lib/validations/trips'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { formatDateValue, parseDateValue } from '@/lib/date'

export function CreateTripDialog() {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string>()
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<CreateTripFormValues>({
    resolver: zodResolver(createTripSchema),
  })

  const startDate = useWatch({ control, name: 'start_date' })
  const endDate = useWatch({ control, name: 'end_date' })

  const onSubmit = handleSubmit(() => {
    setServerError(undefined)
    startTransition(async () => {
      const result = await createTrip({}, new FormData(formRef.current!))

      if (result.error) {
        setServerError(result.error)
        return
      }

      toast.success('旅程建立成功')
      reset()
      setOpen(false)
    })
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          reset()
          setServerError(undefined)
        }
      }}
    >
      <DialogTrigger render={<Button />}>新增旅程</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新增旅程</DialogTitle>
          <DialogDescription>輸入旅程名稱與起迄日，建立後即可開始規劃行程。</DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">旅程名稱</Label>
            <Input id="name" type="text" placeholder="大阪旅遊" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">起日</Label>
              <input type="hidden" {...register('start_date')} />
              <InputDate
                id="start_date"
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
              <Label htmlFor="end_date">迄日</Label>
              <input type="hidden" {...register('end_date')} />
              <InputDate
                id="end_date"
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
              {isPending ? '建立中…' : '建立旅程'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
