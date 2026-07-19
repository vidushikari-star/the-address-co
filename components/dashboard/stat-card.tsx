import {
  ArrowDownRight,
  ArrowUpRight,
  LucideIcon,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardFooter,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"

import { cn } from "@/lib/utils"

type StatCardProps = {
  title: string
  value: string
  subtitle?: string
  trend?: "up" | "down" | "neutral"
  icon?: LucideIcon
}

export function StatCard({
  title,
  value,
  subtitle,
  trend = "neutral",
  icon: Icon,
}: StatCardProps) {
  return (
    <DashboardCard
      interactive
      className="min-h-180px"
    >
      <DashboardCardHeader>
        <div>
          <p className="text-sm font-medium tracking-wide text-muted-foreground">
            {title}
          </p>

          <h3 className="mt-4 text-5xl font-semibold tracking-tight text-foreground">
            {value}
          </h3>
        </div>

        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted/60 transition-colors group-hover:bg-primary/10">
            <Icon className="h-5 w-5 text-primary/80" />
          </div>
        )}
      </DashboardCardHeader>

      <DashboardCardContent />

      {subtitle && (
        <DashboardCardFooter>
          {trend === "up" && (
            <ArrowUpRight className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
          )}

          {trend === "down" && (
            <ArrowDownRight className="h-4 w-4 text-rose-700 dark:text-rose-400" />
          )}

          <span
            className={cn(
              "text-sm font-medium",
              trend === "up" &&
                "text-emerald-700 dark:text-emerald-400",
              trend === "down" &&
                "text-rose-700 dark:text-rose-400",
              trend === "neutral" &&
                "text-muted-foreground"
            )}
          >
            {subtitle}
          </span>
        </DashboardCardFooter>
      )}
    </DashboardCard>
  )
}