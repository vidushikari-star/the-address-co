import type { ReactNode } from "react"

type ActivityItemProps = {
  icon: ReactNode
  title: string
  time: string
  children?: ReactNode
}

export function ActivityItem({
  icon,
  title,
  time,
  children,
}: ActivityItemProps) {
  return (
    <div className="relative flex gap-4">
      {/* Timeline */}
      <div className="flex flex-col items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border bg-background">
          {icon}
        </div>

        <div className="mt-2 h-full w-px bg-border" />
      </div>

      {/* Content */}
      <div className="flex-1 rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">
            {title}
          </h4>

          <p className="text-sm text-muted-foreground">
            {time}
          </p>
        </div>

        {children && (
          <div className="mt-4 space-y-3">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}