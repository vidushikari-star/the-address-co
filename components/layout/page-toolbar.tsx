import { cn } from "@/lib/utils"

interface PageToolbarProps {
  children: React.ReactNode
  className?: string
}

export function PageToolbar({
  children,
  className,
}: PageToolbarProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3",
        className
      )}
    >
      {children}
    </div>
  )
}