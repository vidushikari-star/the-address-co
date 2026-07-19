import * as React from "react"

import { cn } from "@/lib/utils"

interface DashboardCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean
}

function DashboardCard({
  className,
  interactive = true,
  ...props
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/60 bg-background shadow-sm",
        interactive && [
          "group",
          "transition-all duration-200",
          "hover:-translate-y-0.5",
          "hover:border-primary/10",
          "hover:shadow-lg",
        ],
        className
      )}
      {...props}
    />
  )
}

function DashboardCardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-start justify-between p-7 pb-0",
        className
      )}
      {...props}
    />
  )
}

function DashboardCardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  )
}

function DashboardCardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col px-7 py-5",
        className
      )}
      {...props}
    />
  )
}

function DashboardCardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 px-7 pb-7",
        className
      )}
      {...props}
    />
  )
}

export {
  DashboardCard,
  DashboardCardHeader,
  DashboardCardTitle,
  DashboardCardContent,
  DashboardCardFooter,
}