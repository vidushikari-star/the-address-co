import { cn } from "@/lib/utils"

type ClickableCardProps = {
  children: React.ReactNode
  className?: string
}

export function ClickableCard({
  children,
  className,
}: ClickableCardProps) {
  return (
    <button
      className={cn(
        "group w-full rounded-3xl border border-border/60 bg-card text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-background",
        className
      )}
    >
      {children}
    </button>
  )
}