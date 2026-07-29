import Link from "next/link"

import { ReportCard } from "@/components/reports/report-card"

import type {
  CommissionDistribution,
} from "@/types/commission-distribution"

type Props = {
  distributions: CommissionDistribution[]
}

function money(
  value: number
) {
  return `₹${value.toLocaleString("en-IN")}`
}

export function PartnerSettlement({
  distributions,
}: Props) {
  const total = distributions.reduce(
    (sum, item) =>
      sum + item.amount,
    0
  )

  const paid = distributions
    .filter(
      (item) =>
        item.status === "paid"
    )
    .reduce(
      (sum, item) =>
        sum + item.amount,
      0
    )

  const pending =
    total - paid

  const paidPercentage =
    total === 0
      ? 0
      : Math.round(
          (paid / total) * 100
        )

  return (
    <section className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Partner Settlement
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Monitor partner payouts and outstanding settlements.
          </p>
        </div>

        <Link
          href="/api/reports/settlement/export"
          className="inline-flex w-full items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted sm:w-auto"
        >
          Download Excel
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ReportCard
          title="Total Payable"
          value={money(total)}
        />

        <ReportCard
          title="Paid"
          value={money(paid)}
        />

        <ReportCard
          title="Pending"
          value={money(pending)}
        />

        <ReportCard
          title="Settlement Rate"
          value={`${paidPercentage}%`}
          description="Partner payouts completed"
        />
      </div>
    </section>
  )
}