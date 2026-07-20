"use client"

import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface ActionButtonProps {
  icon: LucideIcon
  children: React.ReactNode
  onClick?: () => void
}

export function ActionButton({
  icon: Icon,
  children,
  onClick,
}: ActionButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      <Icon className="h-4 w-4" />
      {children}
    </Button>
  )
}