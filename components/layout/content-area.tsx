import { cn } from "@/lib/utils"

interface ContentAreaProps {
  children: React.ReactNode
  className?: string
}

export function ContentArea({
  children,
  className,
}: ContentAreaProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col gap-8",
        className
      )}
    >
      {children}
    </div>
  )
}