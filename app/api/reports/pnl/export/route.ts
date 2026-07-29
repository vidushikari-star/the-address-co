import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

import { getServerUserProfile } from "@/lib/auth/server-user-profile"

import { getCommissions } from "@/lib/repositories/commission-repository"
import { getExpenses } from "@/lib/repositories/expense-repository"

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
  let expenses

  try {
    ;[commissions, expenses] =
      await Promise.all([
        getCommissions(),
        getExpenses(),
      ])

    commissions = filterByDate(
      commissions,
      range
    )

    expenses = filterByDate(
      expenses,
      range
    )
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error:
          "Failed to generate P&L report.",
      },
      {
        status: 500,
      }
    )
  }

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

  const expenseTotal =
    expenses.reduce(
      (sum, item) =>
        sum + item.amount,
      0
    )

  const workbook =
    XLSX.utils.book_new()

  const summary = [
    {
      Metric:
        "Commission Received",
      Amount: income,
    },
    {
      Metric: "Expenses",
      Amount: expenseTotal,
    },
    {
      Metric: "Net Profit",
      Amount:
        income - expenseTotal,
    },
  ]

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      summary
    ),
    "Summary"
  )

  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.json_to_sheet(
      expenses.map((item) => ({
        Date: item.date,
        Category: item.category,
        Description:
          item.description,
        Amount: item.amount,
        Status: item.status,
      }))
    ),
    "Expenses"
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
        'attachment; filename="The_Address_Co_PnL.xlsx"',
    },
  })
}