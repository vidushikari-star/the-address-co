import { cn } from "@/lib/utils"

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "outline"

type BadgeProps = {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  default:
    "bg-muted text-foreground",

  success:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",

  warning:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",

  danger:
    "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",

  outline:
    "border border-border bg-background",
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium transition-colors",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}