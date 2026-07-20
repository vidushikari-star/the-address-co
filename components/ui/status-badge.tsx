"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  label: string
  variant?: "default" | "success" | "warning" | "danger"
}

const variants = {
  default: "",
  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  danger:
    "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
}

export function StatusBadge({
  label,
  variant = "default",
}: StatusBadgeProps) {
  return (
    <Badge
      className={cn(
        "rounded-full px-3 py-1 font-medium",
        variants[variant]
      )}
    >
      {label}
    </Badge>
  )
}