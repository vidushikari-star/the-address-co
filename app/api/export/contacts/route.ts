import {
  NextResponse,
} from "next/server"

import * as XLSX from "xlsx"

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"



export async function GET(){

  const supabase =
    await createServerSupabaseClient()


  const {
    data,
    error,
  } =
    await supabase
      .from("contacts")
      .select("*")
      .order(
        "created_at",
        {
          ascending:false,
        }
      )


  if(error){

    throw error

  }



  const rows =
    (data ?? []).map(
      contact => ({

        Name:
          contact.full_name ??
          `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim(),


        Phone:
          contact.phone ?? "",


        Email:
          contact.email ?? "",


        LeadSource:
          contact.lead_source ?? "",


        Stage:
          contact.lead_stage ?? "",


        Budget:
          contact.budget_max ?? "",


        Created:
          contact.created_at ?? "",

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