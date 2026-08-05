"use client"

import { useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "確認刪除",
  pendingLabel = "刪除中…",
  errorFallback = "刪除失敗",
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  description: ReactNode
  confirmLabel?: string
  pendingLabel?: string
  errorFallback?: string
  onConfirm: () => Promise<void>
}) {
  const [serverError, setServerError] = useState<string>()
  const [isPending, setIsPending] = useState(false)

  async function handleConfirm() {
    setServerError(undefined)
    setIsPending(true)
    try {
      await onConfirm()
      onOpenChange(false)
    } catch (error) {
      setServerError(error instanceof Error ? error.message : errorFallback)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (!next) setServerError(undefined)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {serverError && (
          <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {serverError}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
