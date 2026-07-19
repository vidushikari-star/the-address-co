import { cn } from "@/lib/utils"

type CardProps = {
  children: React.ReactNode
  className?: string
}

export function Card({
  children,
  className,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border/60 bg-card transition-all duration-200",
        className
      )}
    >
      {children}
    </div>
  )
}