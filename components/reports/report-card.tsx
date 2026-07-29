type Props = {
  title: string
  value: string
  description?: string
}

export function ReportCard({
  title,
  value,
  description,
}: Props) {
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-6">
      <div className="space-y-2">
        <p className="text-sm font-medium text-muted-foreground">
          {title}
        </p>

        <h3 className="break-words text-2xl font-bold tracking-tight sm:text-3xl">
          {value}
        </h3>

        {description && (
          <p className="max-w-prose text-xs leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}