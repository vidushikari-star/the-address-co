import {
  NextResponse,
} from "next/server"


import * as XLSX from "xlsx"


import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"


import {
  getProperties,
} from "@/lib/repositories/property-repository"


import {
  getDeals,
} from "@/lib/repositories/deal-repository"


import {
  getCommissions,
} from "@/lib/repositories/commission-repository"


import {
  getAllCommissionDistributions,
} from "@/lib/repositories/commission-distribution-repository"


import {
  getExpenses,
} from "@/lib/repositories/expense-repository"


import {
  getAllUserProfiles,
} from "@/lib/repositories/user-profile-repository"


import {
  getCompanySettings,
} from "@/lib/repositories/company-settings-repository"


import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"







export async function GET(){


  const [
    contacts,
    properties,
    deals,
    commissions,
    distributions,
    expenses,
    users,
    settings,
  ] =
  await Promise.all([

    ContactsRepository.getAll(),

    getProperties(),

    getDeals(),

    getCommissions(),

    getAllCommissionDistributions(),

    getExpenses(),

    getAllUserProfiles(),

    getCompanySettings(),

  ])





  const supabase =
    await createServerSupabaseClient()





  const {
    data:tasks,
  } =
  await supabase
    .from("tasks")
    .select("*")







  const workbook =
    XLSX.utils.book_new()





  function addSheet(
    name:string,
    data:any[]
  ){

    const sheet =
      XLSX.utils.json_to_sheet(
        data
      )


    XLSX.utils.book_append_sheet(
      workbook,
      sheet,
      name
    )

  }







  addSheet(
    "Contacts",
    contacts
  )



  addSheet(
    "Properties",
    properties
  )



  addSheet(
    "Deals",
    deals
  )



  addSheet(
    "Tasks",
    tasks ?? []
  )



  addSheet(
    "Commissions",
    commissions
  )



  addSheet(
    "Commission Splits",
    distributions
  )



  addSheet(
    "Expenses",
    expenses
  )



  addSheet(
    "Users",
    users
  )



  addSheet(
    "Settings",
    Object.entries(
      settings
    )
    .map(
      (
        [
          key,
          value,
        ]
      ) => ({

        Key:key,

        Value:value,

      })
    )
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
          `attachment; filename="The_Address_Co_Full_Backup.xlsx"`,

      },

    }
  )

}