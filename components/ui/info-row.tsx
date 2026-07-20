"use client"

import { LucideIcon } from "lucide-react"

interface InfoRowProps {
  icon: LucideIcon
  label: string
}

export function InfoRow({
  icon: Icon,
  label,
}: InfoRowProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
  )
}