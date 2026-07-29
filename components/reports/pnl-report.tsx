import Link from "next/link"

import { ReportCard } from "@/components/reports/report-card"

import type { Commission } from "@/types/commission"
import type { Expense } from "@/types/expense"

type Props = {
  commissions: Commission[]
  expenses: Expense[]
}

function money(value: number) {
  return `₹${value.toLocaleString("en-IN")}`
}

export function PnLReport({
  commissions,
  expenses,
}: Props) {
  const income = commissions
    .filter(
      (item) =>
        item.status === "received"
    )
    .reduce(
      (sum, item) =>
        sum + item.amount,
      0
    )

  const expenseTotal = expenses.reduce(
    (sum, item) =>
      sum + item.amount,
    0
  )

  const profit =
    income - expenseTotal

  return (
    <section className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Profit &amp; Loss
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Summary of received commission, expenses and current profitability.
          </p>
        </div>

        <Link
          href="/api/reports/pnl/export"
          className="inline-flex w-full items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted sm:w-auto"
        >
          Download Excel
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <ReportCard
          title="Commission Received"
          value={money(income)}
        />

        <ReportCard
          title="Expenses"
          value={money(expenseTotal)}
        />

        <ReportCard
          title="Net Profit"
          value={money(profit)}
        />
      </div>
    </section>
  )
}