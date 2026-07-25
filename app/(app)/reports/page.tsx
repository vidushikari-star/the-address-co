import {
  redirect,
} from "next/navigation"


import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"


import {
  getCommissions,
} from "@/lib/repositories/commission-repository"


import {
  getExpenses,
} from "@/lib/repositories/expense-repository"


import {
  getAllCommissionDistributions,
} from "@/lib/repositories/commission-distribution-repository"


import {
  PnLReport,
} from "@/components/reports/pnl-report"


import {
  CommissionReport,
} from "@/components/reports/commission-report"


import {
  SalesReport,
} from "@/components/reports/sales-report"


import {
  PartnerSettlement,
} from "@/components/reports/partner-settlement"

import {
  ReportSummary,
} from "@/components/reports/report-summary"

import {
  ReportFilter,
} from "@/components/reports/report-filter"

import {
  ReportRange,
  getDateRange,
} from "@/lib/reports/report-date-utils"

import {
  filterByDate,
} from "@/lib/reports/filter-report-data"

export default async function ReportsPage({

  searchParams,

}:{

  searchParams:Promise<{
    range?:string
  }>

}){



  const user =
    await getServerUserProfile()

    const params =
  await searchParams


const range =
  params.range ?? "all"





  if(
    !user ||
    user.role !== "admin"
  ){

    redirect(
      "/dashboard"
    )

  }







  const commissions =
    await getCommissions()





  const expenses =
    await getExpenses()





  const distributions =
    await getAllCommissionDistributions()

    const filteredCommissions =
  filterByDate(
    commissions,
    range as ReportRange
  )


const filteredExpenses =
  filterByDate(
    expenses,
    range as ReportRange
  )


const filteredDistributions =
  filterByDate(
    distributions,
    range as ReportRange
  )

const dateRange =
  getDateRange(
    range as ReportRange
  )

const totalCommission =
  commissions.reduce(
    (
      sum,
      item
    ) =>
      sum + item.amount,
    0
  )


const receivedCommission =
  commissions
    .filter(
      item =>
        item.status === "received"
    )
    .reduce(
      (
        sum,
        item
      ) =>
        sum + item.amount,
      0
    )


const pendingCommission =
  totalCommission -
  receivedCommission


const totalExpenses =
  expenses.reduce(
    (
      sum,
      item
    ) =>
      sum + item.amount,
    0
  )


const netProfit =
  receivedCommission -
  totalExpenses



  return (

    <div className="space-y-8 p-8">





      


<div className="flex justify-between items-center">

  <div>
    <h1 className="text-3xl font-semibold">
      Reports
    </h1>

    <p className="text-muted-foreground">
      Financial and business performance reports.
    </p>
  </div>


  <div>

    <a
      href="/reports?range=month"
      className="mr-2 rounded-md border px-3 py-2 text-sm"
    >
      This Month
    </a>


    <a
      href="/reports?range=year"
      className="rounded-md border px-3 py-2 text-sm"
    >
      This Year
    </a>

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