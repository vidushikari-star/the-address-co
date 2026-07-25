import {
  NextResponse,
} from "next/server"


import * as XLSX from "xlsx"


import {
  getAllCommissionDistributions,
} from "@/lib/repositories/commission-distribution-repository"


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





  const distributions =
    filterByDate(
      await getAllCommissionDistributions(),
      range
    )





  const rows =
    distributions.map(
      item => ({

        Deal:
          item.dealName ?? "-",


        Person:
          item.userName ?? "-",


        Role:
          item.role.replace(
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
          `attachment; filename="The_Address_Co_Partner_Settlement.xlsx"`,

      },

    }
  )

}