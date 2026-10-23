import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

import { getServerUserProfile } from "@/lib/auth/server-user-profile"
import { filterFinancialDashboardDataByRange, getFinancialDashboardData } from "@/lib/services/financial-dashboard-service"
import type { ReportRange } from "@/lib/reports/report-date-utils"

export async function GET(request: Request) {
  const user = await getServerUserProfile()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const range = (new URL(request.url).searchParams.get("range") ?? "all") as ReportRange
  try {
    const data = filterFinancialDashboardDataByRange(await getFinancialDashboardData(), range)
    const { summary } = data
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet([
      { Metric: "My Income", Amount: summary.myIncome }, { Metric: "Other-recipient distributions", Amount: summary.otherRecipientDistributions },
      { Metric: "Paid Expenses", Amount: summary.paidExpenses }, { Metric: "Pending Expenses", Amount: summary.pendingExpenses },
      { Metric: "Total Expenses", Amount: summary.totalExpenses }, { Metric: "Net Income", Amount: summary.netIncome }, { Metric: "Net Cash", Amount: summary.netCash },
    ]), "Summary")
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(data.expenses.map((expense) => ({ Date: expense.date, Category: expense.category, Description: expense.description ?? "", Amount: expense.amount, Status: expense.status }))), "Expenses")
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
    return new NextResponse(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="The_Address_Co_PnL.xlsx"' } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to generate P&L report." }, { status: 500 })
  }
}
