interface PageTitleProps {
  title: string
  description?: string
}

export function PageTitle({
  title,
  description,
}: PageTitleProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-semibold tracking-tight">
        {title}
      </h1>

      {description && (
        <p className="text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  )
}