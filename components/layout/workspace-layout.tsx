import { cn } from "@/lib/utils"

interface WorkspaceLayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function WorkspaceLayout({
  sidebar,
  children,
  className,
}: WorkspaceLayoutProps) {
  return (
    <div
      className={cn(
        "flex min-h-screen bg-muted/20",
        className
      )}
    >
      {sidebar}

      <div className="flex min-w-0 flex-1 flex-col">
        {children}
      </div>
    </div>
  )
}