import { cn } from "@/lib/utils"

type ProfileCardProps = {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function ProfileCard({
  title,
  description,
  children,
  className,
}: ProfileCardProps) {
  return (
    <section
      className={cn(
        "rounded-3xl border border-border/60 bg-card p-6",
        className
      )}
    >
      <div className="mb-6">
        <h2 className="text-lg font-semibold tracking-tight">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {children}
    </section>
  )
}