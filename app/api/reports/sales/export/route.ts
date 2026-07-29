import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

import { getServerUserProfile } from "@/lib/auth/server-user-profile"

import { getDeals } from "@/lib/repositories/deal-repository"

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

  let deals

  try {
    deals = filterByDate(
      await getDeals(),
      range
    )
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to generate sales report.",
      },
      {
        status: 500,
      }
    )
  }

  const rows = deals.map(
    (deal) => ({
      Deal: deal.name,

      Advisor:
        deal.advisor ?? "-",

      Stage:
        deal.stage,

      PropertyValue:
        deal.value.propertyPrice,

      Commission:
        deal.value.commissionAmount,

      ExpectedCloseDate:
        deal.expectedCloseDate ?? "-",

      Probability:
        `${deal.probability}%`,

      CreatedDate:
        deal.createdAt,
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
    "Sales"
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
        'attachment; filename="The_Address_Co_Sales.xlsx"',
    },
  })
}