import { ReactNode } from "react"

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
    <section className="space-y-4 rounded-xl border bg-card p-6">
      <div>
        <h3 className="text-base font-semibold">{title}</h3>

        {description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {children}
      </div>
    </section>
  )
}