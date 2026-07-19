import { cn } from "@/lib/utils"

interface SectionProps {
  children: React.ReactNode
  className?: string
}

export function Section({
  children,
  className,
}: SectionProps) {
  return (
    <section
      className={cn(
        "space-y-6",
        className
      )}
    >
      {children}
    </section>
  )
}