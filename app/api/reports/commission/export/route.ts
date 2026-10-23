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
    const rows = data.summary.commissionReconciliations.map((item) => ({
      Deal: item.commission.dealName ?? "-", GrossCommission: item.gross, Status: item.commission.status,
      ReceivedDate: item.commission.receivedDate ?? item.commission.paymentDate ?? "-",
      PrincipalAllocation: item.principalAllocation, OtherRecipientAllocation: item.otherRecipientAllocation,
      Unallocated: item.unallocated, Overallocated: item.overallocated, Reconciliation: item.reconciliationStatus,
    }))
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), "Commissions")
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })
    return new NextResponse(buffer, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": 'attachment; filename="The_Address_Co_Commissions.xlsx"' } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to generate commission report." }, { status: 500 })
  }
}
