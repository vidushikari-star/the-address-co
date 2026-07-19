import {
  DashboardCard,
  DashboardCardContent,
} from "@/components/ui/dashboard-card"

interface Stat {
  label: string
  value: string
}

interface StatsRowProps {
  stats: Stat[]
}

export function StatsRow({ stats }: StatsRowProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <DashboardCard key={stat.label} interactive={false}>
          <DashboardCardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              {stat.label}
            </p>

            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {stat.value}
            </p>
          </DashboardCardContent>
        </DashboardCard>
      ))}
    </div>
  )
}