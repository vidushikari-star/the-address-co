"use client"

import { Button } from "@/components/ui/button"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void

  title: string
  description: string

  confirmLabel?: string
  cancelLabel?: string

  onConfirm: () => void
  loading?: boolean
}


export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  loading = false,
}: ConfirmDialogProps) {

  return (

    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >

      <DialogContent className="sm:max-w-md">

        <DialogHeader>

          <DialogTitle>
            {title}
          </DialogTitle>


          <DialogDescription>
            {description}
          </DialogDescription>

        </DialogHeader>



        <DialogFooter>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </Button>


          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={loading}
          >

            {loading
              ? "Deleting..."
              : confirmLabel
            }

          </Button>

        </DialogFooter>


      </DialogContent>

    </Dialog>

  )

}