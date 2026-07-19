import { Badge } from "@/components/ui/badge"

type ProfileHeaderProps = {
  title: string
  subtitle: string
  priority?: "High" | "Medium" | "Low"
}

export function ProfileHeader({
  title,
  subtitle,
  priority,
}: ProfileHeaderProps) {
  return (
    <div className="flex items-start justify-between rounded-3xl border border-border/60 bg-card p-8">
      <div>
        <p className="text-sm text-muted-foreground">
          {subtitle}
        </p>

        <h1 className="mt-2 text-4xl font-semibold tracking-tight">
          {title}
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          Last contacted yesterday
        </p>
      </div>

      {priority && (
        <Badge
          variant={
            priority === "High"
              ? "default"
              : "secondary"
          }
        >
          {priority} Priority
        </Badge>
      )}
    </div>
  )
}