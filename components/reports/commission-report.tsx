import Link from "next/link"

import { ReportCard } from "@/components/reports/report-card"

import type { Commission } from "@/types/commission"

type Props = {
  commissions: Commission[]
}

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`
}

export function CommissionReport({
  commissions,
}: Props) {
  const total = commissions.reduce(
    (sum, item) => sum + item.amount,
    0
  )

  const received = commissions
    .filter(
      (item) =>
        item.status === "received"
    )
    .reduce(
      (sum, item) =>
        sum + item.amount,
      0
    )

  const pending =
    total - received

  return (
    <section className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Commission Report
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Overview of total commissions, collections and outstanding receivables.
          </p>
        </div>

        <Link
          href="/api/reports/commission/export"
          className="inline-flex w-full items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted sm:w-auto"
        >
          Download Excel
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ReportCard
          title="Total Commission"
          value={money(total)}
        />

        <ReportCard
          title="Received"
          value={money(received)}
        />

        <ReportCard
          title="Pending"
          value={money(pending)}
        />
      </div>
    </section>
  )
}