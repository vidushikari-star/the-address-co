import Link from "next/link"

import {
  ArrowRight,
} from "lucide-react"

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
  const totalDeals =
    stages.reduce(
      (sum, stage) =>
        sum + stage.count,
      0
    )

  const maxCount =
    Math.max(
      ...stages.map(
        stage => stage.count
      ),
      1
    )

  return (
    <DashboardCard className="h-full">
      <DashboardCardHeader>
        <div>
          <p className="text-sm font-medium tracking-wide text-muted-foreground">
            Deal pipeline
          </p>

          <h3 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
            {totalDeals} active deals
          </h3>
        </div>

        <Link
          href="/deals"
          className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <span className="hidden sm:inline">
            View deals
          </span>

          <ArrowRight className="h-4 w-4" />
        </Link>
      </DashboardCardHeader>

      <DashboardCardContent>
        <div className="space-y-4">
          {
            stages.map(
              stage => {
                const width =
                  (stage.count / maxCount) * 100

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
              }
            )
          }
        </div>
      </DashboardCardContent>
    </DashboardCard>
  )
}
