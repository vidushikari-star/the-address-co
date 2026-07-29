import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

import { getServerUserProfile } from "@/lib/auth/server-user-profile"
import { createServerSupabaseClient } from "@/lib/supabase/server"

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

  const supabase =
    await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("contacts")
    .select(`
      full_name,
      first_name,
      last_name,
      phone,
      email,
      lead_source,
      lead_stage,
      budget_max,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    })

  if (error) {
    console.error(error)

    return NextResponse.json(
      {
        error: "Failed to export contacts.",
      },
      {
        status: 500,
      }
    )
  }

  const rows = (data ?? []).map(
    (contact) => ({
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
    XLSX.utils.json_to_sheet(rows)

  XLSX.utils.book_append_sheet(
    workbook,
    sheet,
    "Contacts"
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
        'attachment; filename="The_Address_Co_Contacts.xlsx"',
    },
  })
}