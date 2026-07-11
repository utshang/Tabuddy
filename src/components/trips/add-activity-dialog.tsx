'use client'

import { useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { addActivity } from '@/lib/actions/activities'
import { addActivitySchema, type AddActivityFormValues } from '@/lib/validations/activities'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function AddActivityDialog({ dayId }: { dayId: number }) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState<string>()
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddActivityFormValues>({
    resolver: zodResolver(addActivitySchema),
    defaultValues: { day_id: dayId },
  })

  const onSubmit = handleSubmit(() => {
    setServerError(undefined)
    startTransition(async () => {
      const result = await addActivity({}, new FormData(formRef.current!))

      if (result.error) {
        setServerError(result.error)
        return
      }

      toast.success('行程新增成功')
      formRef.current?.reset()
      reset({ day_id: dayId })
      setOpen(false)
    })
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) {
          formRef.current?.reset()
          reset({ day_id: dayId })
          setServerError(undefined)
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
          <DialogDescription>輸入行程名稱與停留時間，選填 GoogleMap 連結與備註。</DialogDescription>
        </DialogHeader>

        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          {serverError && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <input type="hidden" {...register('day_id')} />

          <div className="space-y-2">
            <Label htmlFor="name">行程名稱</Label>
            <Input id="name" type="text" placeholder="道頓堀" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="google_map_url">GoogleMap 連結</Label>
            <Input
              id="google_map_url"
              type="text"
              placeholder="https://maps.google.com/..."
              {...register('google_map_url')}
            />
            {errors.google_map_url && (
              <p className="text-sm text-destructive">{errors.google_map_url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_minutes">停留時間（分鐘）</Label>
            <Input
              id="duration_minutes"
              type="number"
              min={1}
              placeholder="30"
              {...register('duration_minutes')}
            />
            {errors.duration_minutes && (
              <p className="text-sm text-destructive">{errors.duration_minutes.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">備註</Label>
            <Textarea id="note" placeholder="推薦晚上去" {...register('note')} />
            {errors.note && <p className="text-sm text-destructive">{errors.note.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? '新增中…' : '新增行程'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
