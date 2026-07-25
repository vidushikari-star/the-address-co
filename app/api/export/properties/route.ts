import {
  NextResponse,
} from "next/server"

import * as XLSX from "xlsx"


import {
  getProperties,
} from "@/lib/repositories/property-repository"





export async function GET(){


  const properties =
    await getProperties()



  const rows =
    properties.map(
      property => ({

        Name:
          property.name,


        Location:
          property.location,


        Locality:
          property.locality ?? "",


        Price:
          property.price?.asking ?? 0,


        Status:
          property.status ?? "",


        


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
    "Properties"
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
          `attachment; filename="The_Address_Co_Properties.xlsx"`,

      },

    }
  )


}