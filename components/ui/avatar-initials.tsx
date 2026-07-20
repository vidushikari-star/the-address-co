"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface AvatarInitialsProps {
  name: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
}

export function AvatarInitials({
  name,
  size = "lg",
  className,
}: AvatarInitialsProps) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("")

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border bg-muted font-semibold text-foreground",
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  )
}