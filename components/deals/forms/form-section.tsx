import type { ReactNode } from "react"

type FormSectionProps = {
  title: string
  description?: string
  children: ReactNode
}

export function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section className="rounded-2xl border bg-card">
      <div className="border-b px-6 py-5">
        <h2 className="text-lg font-semibold">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-6 p-6">
        {children}
      </div>
    </section>
  )
}