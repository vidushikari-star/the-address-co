import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

import { getServerUserProfile } from "@/lib/auth/server-user-profile"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAuthenticatedCrmReadRepository } from "@/lib/repositories/authenticated-crm-read-repository"

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

  const crm = createAuthenticatedCrmReadRepository(await createServerSupabaseClient())

  const { searchParams } =
    new URL(request.url)

  const range =
    (
      searchParams.get("range") ??
      "all"
    ) as ReportRange

  let distributions

  try {
    distributions = filterByDate(
      await crm.getAllCommissionDistributions(),
      range
    )
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to generate partner settlement report.",
      },
      {
        status: 500,
      }
    )
  }

  const rows = distributions.map(
    (item) => ({
      Deal:
        item.dealName ?? "-",

      Person:
        item.userName ?? "-",

      Role:
        item.role.replaceAll(
          "_",
          " "
        ),

      Amount:
        item.amount,

      Status:
        item.status,

      PaidDate:
        item.paidDate ?? "-",

      Notes:
        item.notes ?? "-",
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
    "Settlement"
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
        'attachment; filename="The_Address_Co_Partner_Settlement.xlsx"',
    },
  })
}
