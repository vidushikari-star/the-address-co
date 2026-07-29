import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

import { getServerUserProfile } from "@/lib/auth/server-user-profile"
import { createServerSupabaseClient } from "@/lib/supabase/server"

import { getProperties } from "@/lib/repositories/property-repository"
import { getDeals } from "@/lib/repositories/deal-repository"
import { getCommissions } from "@/lib/repositories/commission-repository"
import { getAllCommissionDistributions } from "@/lib/repositories/commission-distribution-repository"
import { getExpenses } from "@/lib/repositories/expense-repository"
import { getAllUserProfiles } from "@/lib/repositories/user-profile-repository"
import { getCompanySettings } from "@/lib/repositories/company-settings-repository"

async function getContacts() {
  const supabase =
    await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", {
      ascending: false,
    })

  if (error) {
    throw error
  }

  return data ?? []
}

export async function GET() {
  const user = await getServerUserProfile()

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

  const [
    contacts,
    properties,
    deals,
    commissions,
    distributions,
    expenses,
    users,
    settings,
  ] = await Promise.all([
    getContacts(),
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
    data: tasks,
    error: tasksError,
  } = await supabase
    .from("tasks")
    .select("*")

  if (tasksError) {
    return NextResponse.json(
      {
        error: "Failed to export backup.",
      },
      {
        status: 500,
      }
    )
  }

  const workbook =
    XLSX.utils.book_new()

  function addSheet<T extends object>(
  name: string,
  rows: T[]
) {
  const sheet =
    XLSX.utils.json_to_sheet(rows)

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
    Object.entries(settings).map(
      ([key, value]) => ({
        Key: key,
        Value: value,
      })
    )
  )

  const buffer = XLSX.write(
    workbook,
    {
      type: "buffer",
      bookType: "xlsx",
    }
  )

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

      "Content-Disposition":
        'attachment; filename="The_Address_Co_Full_Backup.xlsx"',
    },
  })
}