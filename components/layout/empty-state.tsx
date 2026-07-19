import { DashboardCard } from "@/components/ui/dashboard-card"

interface EmptyStateProps {
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <DashboardCard interactive={false}>
      <div className="flex flex-col items-center justify-center gap-4 px-8 py-16 text-center">
        <h3 className="text-xl font-semibold">
          {title}
        </h3>

        <p className="max-w-md text-muted-foreground">
          {description}
        </p>

        {action}
      </div>
    </DashboardCard>
  )
}