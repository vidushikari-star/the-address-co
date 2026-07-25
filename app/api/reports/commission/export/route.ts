import {
  NextResponse,
} from "next/server"


import * as XLSX from "xlsx"


import {
  getCommissions,
} from "@/lib/repositories/commission-repository"


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





  const rows =
    commissions.map(
      commission => ({

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
          `attachment; filename="The_Address_Co_Commissions.xlsx"`,

      },

    }
  )


}