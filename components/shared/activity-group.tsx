import type { ReactNode } from "react"

type ActivityGroupProps = {
  title: string
  children: ReactNode
}

export function ActivityGroup({
  title,
  children,
}: ActivityGroupProps) {
  return (
    <section className="space-y-5">
      <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>

      <div className="space-y-6">
        {children}
      </div>
    </section>
  )
}