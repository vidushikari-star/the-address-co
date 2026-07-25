import {
  NextResponse,
} from "next/server"

import * as XLSX from "xlsx"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"



export async function GET(){


  const contacts =
    await ContactsRepository.getAll()



  const rows =
    contacts.map(
      contact => ({

        Name:
          contact.name,

        Phone:
          contact.phone ?? "",

        Email:
          contact.email ?? "",

        Type:
          contact.type ?? "",

        

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
    "Contacts"
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
          `attachment; filename="The_Address_Co_Contacts.xlsx"`,

      },

    }
  )


}