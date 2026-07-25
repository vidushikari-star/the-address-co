import {
  NextResponse,
} from "next/server"


import * as XLSX from "xlsx"


import {
  getDeals,
} from "@/lib/repositories/deal-repository"


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





  const deals =
    filterByDate(
      await getDeals(),
      range
    )





  const rows =
    deals.map(
      deal => ({

        Deal:
          deal.name,


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
          `attachment; filename="The_Address_Co_Sales.xlsx"`,

      },

    }
  )


}