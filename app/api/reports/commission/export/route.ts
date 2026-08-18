import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

import { getServerUserProfile } from "@/lib/auth/server-user-profile"

import { getCommissions } from "@/lib/repositories/commission-server-repository"

import { filterByDate } from "@/lib/reports/filter-report-data"

import type { ReportRange } from "@/lib/reports/report-date-utils"

export async function GET(
  request: Request
) {
  const user =
    await getServerUserProfile()

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  if (user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    )
  }

  const { searchParams } =
    new URL(request.url)

  const range =
    (
      searchParams.get("range") ??
      "all"
    ) as ReportRange

  let commissions

  try {
    commissions = filterByDate(
      await getCommissions(),
      range
    )
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to generate commission report.",
      },
      {
        status: 500,
      }
    )
  }

  const rows = commissions.map(
    (commission) => ({
      Deal:
        commission.dealName ?? "-",

      Advisor:
        commission.advisorName ?? "-",

      Type:
        commission.type,

      Amount:
        commission.amount,

      Status:
        commission.status,

      DueDate:
        commission.dueDate ?? "-",

      ReceivedDate:
        commission.receivedDate ?? "-",

      Notes:
        commission.notes ?? "-",
    })
  )

  const workbook =
    XLSX.utils.book_new()

  const sheet =
    XLSX.utils.json_to_sheet(
      rows
    )

  XLSX.utils.book_append_sheet(
    workbook,
    sheet,
    "Commissions"
  )

  const buffer =
    XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    })

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

      "Content-Disposition":
        'attachment; filename="The_Address_Co_Commissions.xlsx"',
    },
  })
}
