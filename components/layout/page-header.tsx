import type { ReactNode } from "react"

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 md:flex-row md:items-end md:justify-between">

      <div className="space-y-2">

        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground sm:text-sm">
            {eyebrow}
          </p>
        )}

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
          {title}
        </h1>

        {description && (
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            {description}
          </p>
        )}

      </div>


      {actions && (
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          {actions}
        </div>
      )}

    </div>
  )
}