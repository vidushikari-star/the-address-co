import Link from "next/link"

import { ReportCard } from "@/components/reports/report-card"

import type { ReportRange } from "@/lib/reports/report-date-utils"
import type { SalesDeal } from "@/lib/services/reports/sales-report-service"

type Props = {
  deals: SalesDeal[]
  range: ReportRange
}

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`
}

export function SalesReport({
  deals,
  range,
}: Props) {
  const totalDeals =
    deals.length

  const totalCommission =
    deals.reduce(
      (sum, item) =>
        sum + item.commissionAmount,
      0
    )

  const completedDeals =
    deals.filter(
      (item) =>
        item.stage === "closed_won"
    ).length

  const completionRate =
    totalDeals === 0
      ? 0
      : Math.round(
          (completedDeals /
            totalDeals) *
            100
        )

  return (
    <section className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Sales Report
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Overview of deal activity, completed transactions and commission generation.
          </p>
        </div>

        <Link
          href={`/api/reports/sales/export?range=${range}`}
          className="inline-flex w-full items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted sm:w-auto"
        >
          Download Excel
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportCard
          title="Total Deals"
          value={totalDeals.toString()}
          description="Created opportunities"
        />

        <ReportCard
          title="Completed Deals"
          value={completedDeals.toString()}
          description="Closed-won opportunities"
        />

        <ReportCard
          title="Completion Rate"
          value={`${completionRate}%`}
          description="Percentage of completed deals"
        />

        <ReportCard
          title="Expected Commission"
          value={money(totalCommission)}
        />
      </div>
    </section>
  )
}
