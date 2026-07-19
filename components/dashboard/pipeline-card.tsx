import { ArrowRight } from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"

type PipelineStage = {
  title: string
  count: number
}

type PipelineCardProps = {
  stages: PipelineStage[]
}

export function PipelineCard({
  stages,
}: PipelineCardProps) {
  const totalDeals = stages.reduce(
    (sum, stage) => sum + stage.count,
    0
  )

  const maxCount = Math.max(
    ...stages.map((stage) => stage.count)
  )

  return (
    <DashboardCard className="h-full">
      <DashboardCardHeader>
        <div>
          <p className="text-sm font-medium tracking-wide text-muted-foreground">
            Deals Pipeline
          </p>

          <h3 className="mt-2 text-2xl font-semibold tracking-tight">
            {totalDeals} Active Deals
          </h3>
        </div>

        <ArrowRight className="h-5 w-5 text-muted-foreground" />
      </DashboardCardHeader>

      <DashboardCardContent>
        {/* Summary */}

        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-border/60 bg-muted/30 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-background">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Active Clients
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-tight">
              42
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              6 added this month
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/30 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-background">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Live Inventory
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-tight">
              ₹52 Cr
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Across 31 listings
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/30 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-background">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Commission Potential
            </p>

            <p className="mt-3 text-3xl font-semibold tracking-tight">
              ₹1.84 Cr
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              From active deals
            </p>
          </div>
        </div>

        {/* Pipeline */}

        <div className="space-y-5">
          {stages.map((stage) => {
            const width = (stage.count / maxCount) * 100

            return (
              <div key={stage.title}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {stage.title}
                  </span>

                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                    {stage.count}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{
                      width: `${width}%`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </DashboardCardContent>
    </DashboardCard>
  )
}