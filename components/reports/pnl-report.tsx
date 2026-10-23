import Link from "next/link"

import { ReportCard } from "@/components/reports/report-card"
import type { FinancialSummary } from "@/lib/finance/financial-model"
import type { ReportRange } from "@/lib/reports/report-date-utils"

type Props = { summary: FinancialSummary; range: ReportRange }
function money(value: number) { return `₹${value.toLocaleString("en-IN")}` }

export function PnLReport({ summary, range }: Props) {
  return <section className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-semibold">Profit &amp; Loss</h2><p className="mt-1 text-sm text-muted-foreground">Economic net income uses the principal allocation less all recorded business expenses. Net cash is separate.</p></div><Link href={`/api/reports/pnl/export?range=${range}`} className="inline-flex w-full items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted sm:w-auto">Download Excel</Link></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><ReportCard title="My Income" value={money(summary.myIncome)} /><ReportCard title="Total Expenses" value={money(summary.totalExpenses)} /><ReportCard title="Net Income" value={money(summary.netIncome)} /><ReportCard title="Net Cash" value={money(summary.netCash)} /></div>
  </section>
}
