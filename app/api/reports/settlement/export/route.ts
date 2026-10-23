import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

import { getServerUserProfile } from "@/lib/auth/server-user-profile"
import { getDateRange, type ReportRange } from "@/lib/reports/report-date-utils"
import { getDistributionFinancialDate } from "@/lib/finance/financial-model"
import { getFinancialDashboardData } from "@/lib/services/financial-dashboard-service"

export async function GET(request: Request) {
  const user = await getServerUserProfile()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  const range = (new URL(request.url).searchParams.get("range") ?? "all") as ReportRange
  try {
    const data = await getFinancialDashboardData()
    const { start, end } = getDateRange(range)
    const distributions = data.distributions.filter((distribution) =>
      !(distribution.recipientKind === "crm_user" && distribution.crmUserId === data.principal.id) &&
      (!start || !end || (new Date(getDistributionFinancialDate(distribution)) >= start && new Date(getDistributionFinancialDate(distribution)) <= end))
    )
    const commissions = new Map(data.commissions.map((commission) => [commission.id, commission]))
    const rows = distributions.map((distribution) => ({ Deal: commissions.get(distribution.commissionId)?.dealName ?? "-", Recipient: distribution.recipientName ?? "-", RecipientType: distribution.recipientKind, Role: distribution.role ?? "-", Amount: distribution.amount, Status: distribution.status, PaidDate: distribution.paidDate ?? "-", Notes: distribution.notes ?? "" }))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Settlement")
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
    return new NextResponse(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="The_Address_Co_Partner_Settlement.xlsx"' } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to generate partner settlement report." }, { status: 500 })
  }
}
