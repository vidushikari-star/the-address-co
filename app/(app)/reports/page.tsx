import Link from "next/link"
import { redirect } from "next/navigation"

import { getServerUserProfile } from "@/lib/auth/server-user-profile"

import { getCommissions } from "@/lib/repositories/commission-repository"
import { getExpenses } from "@/lib/repositories/expense-repository"
import { getAllCommissionDistributions } from "@/lib/repositories/commission-distribution-repository"

import { PnLReport } from "@/components/reports/pnl-report"
import { CommissionReport } from "@/components/reports/commission-report"
import { SalesReport } from "@/components/reports/sales-report"
import { PartnerSettlement } from "@/components/reports/partner-settlement"

import {
  ReportRange,
} from "@/lib/reports/report-date-utils"

import {
  filterByDate,
} from "@/lib/reports/filter-report-data"

type Props = {
  searchParams: Promise<{
    range?: string
  }>
}

export default async function ReportsPage({
  searchParams,
}: Props) {
  const user =
    await getServerUserProfile()

  if (
    !user ||
    user.role !== "admin"
  ) {
    redirect("/dashboard")
  }

  const params =
    await searchParams

  const range =
    (params.range as ReportRange) ??
    "all"

  const [
    commissions,
    expenses,
    distributions,
  ] = await Promise.all([
    getCommissions(),
    getExpenses(),
    getAllCommissionDistributions(),
  ])

  const filteredCommissions =
    filterByDate(
      commissions,
      range
    )

  const filteredExpenses =
    filterByDate(
      expenses,
      range
    )

  const filteredDistributions =
    filterByDate(
      distributions,
      range
    )

  const filterButton = (
    label: string,
    value: ReportRange
  ) => {
    const active =
      range === value

    return (
      <Link
        href={`/reports?range=${value}`}
        className={`rounded-lg border px-4 py-2 text-sm transition-colors ${
          active
            ? "bg-primary text-primary-foreground border-primary"
            : "hover:bg-muted"
        }`}
      >
        {label}
      </Link>
    )
  }

  return (
    <div className="mx-auto max-w-[1650px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">
            Reports
          </h1>

          <p className="mt-1 text-muted-foreground">
            Financial and business performance reports.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterButton("All", "all")}
          {filterButton("This Month", "month")}
          {filterButton("This Year", "year")}
        </div>
      </div>

      <PnLReport
        commissions={
          filteredCommissions
        }
        expenses={
          filteredExpenses
        }
      />

      <CommissionReport
        commissions={
          filteredCommissions
        }
      />

      <SalesReport
        commissions={
          filteredCommissions
        }
      />

      <PartnerSettlement
        distributions={
          filteredDistributions
        }
      />
    </div>
  )
}