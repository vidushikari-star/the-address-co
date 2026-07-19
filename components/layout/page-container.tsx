import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({
  children,
  className,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-[1600px] flex-col gap-8 p-8",
        className
      )}
    >
      {children}
    </main>
  )
}