"use client"

import { ReactNode } from "react"

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type FormDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}

export function FormDrawer({
  open,
  onOpenChange,
  title,
  description,
  children,
}: FormDrawerProps) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-2xl"
      >
        <SheetHeader className="mb-6">
          <SheetTitle>{title}</SheetTitle>

          {description && (
            <SheetDescription>
              {description}
            </SheetDescription>
          )}
        </SheetHeader>

        {children}
      </SheetContent>
    </Sheet>
  )
}