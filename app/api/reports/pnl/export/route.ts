import {
  NextResponse,
} from "next/server"


import * as XLSX from "xlsx"


import {
  getCommissions,
} from "@/lib/repositories/commission-repository"


import {
  getExpenses,
} from "@/lib/repositories/expense-repository"


import {
  filterByDate,
} from "@/lib/reports/filter-report-data"


import type {
  ReportRange,
} from "@/lib/reports/report-date-utils"





export async function GET(
  request:Request
){


  const {
    searchParams,
  } =
  new URL(
    request.url
  )



  const range =
    (
      searchParams.get(
        "range"
      ) ?? "all"
    ) as ReportRange





  const commissions =
    filterByDate(
      await getCommissions(),
      range
    )



  const expenses =
    filterByDate(
      await getExpenses(),
      range
    )





  const income =
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





  const expenseTotal =
    expenses.reduce(
      (
        sum,
        item
      ) =>
        sum + item.amount,
      0
    )





  const workbook =
    XLSX.utils.book_new()





  const summary = [

    {
      Metric:
        "Commission Received",

      Amount:
        income,
    },


    {
      Metric:
        "Expenses",

      Amount:
        expenseTotal,
    },


    {
      Metric:
        "Net Profit",

      Amount:
        income - expenseTotal,
    },

  ]





  const incomeSheet =
    XLSX.utils.json_to_sheet(
      summary
    )


  XLSX.utils.book_append_sheet(
    workbook,
    incomeSheet,
    "Summary"
  )





  const expenseSheet =
    XLSX.utils.json_to_sheet(
      expenses.map(
        item => ({

          Date:
            item.date,

          Category:
            item.category,

          Description:
            item.description,

          Amount:
            item.amount,

          Status:
            item.status,

        })
      )
    )



  XLSX.utils.book_append_sheet(
    workbook,
    expenseSheet,
    "Expenses"
  )





  const buffer =
    XLSX.write(
      workbook,
      {
        type:"buffer",
        bookType:"xlsx",
      }
    )





  return new NextResponse(
    buffer,
    {

      headers:{

        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",


        "Content-Disposition":
          `attachment; filename="The_Address_Co_PnL.xlsx"`,

      },

    }
  )

}