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
    .from("properties")
    .select(`
      name,
      developer,
      property_type,
      listing_type,
      status,
      location,
      locality,
      price,
      bedrooms,
      bathrooms,
      carpet_area,
      built_up_area,
      plot_area,
      furnishing,
      description,
      specifications,
      created_at
    `)
    .order("created_at", {
      ascending: false,
    })

  if (error) {
    console.error(error)

    return NextResponse.json(
      {
        error: "Failed to export properties.",
      },
      {
        status: 500,
      }
    )
  }

  const rows = (data ?? []).map(
    (property) => ({
      Name: property.name ?? "",

      Developer:
        property.developer ?? "",

      Type:
        property.property_type ?? "",

      ListingType:
        property.listing_type ?? "",

      Status:
        property.status ?? "",

      Location:
        property.location ?? "",

      Locality:
        property.locality ?? "",

      Price:
        typeof property.price ===
        "object"
          ? property.price?.asking ?? ""
          : property.price ?? "",

      Bedrooms:
        property.bedrooms ??
        property.specifications
          ?.bedrooms ??
        "",

      Bathrooms:
        property.bathrooms ??
        property.specifications
          ?.bathrooms ??
        "",

      CarpetArea:
        property.carpet_area ??
        property.specifications
          ?.carpetArea ??
        "",

      BuiltUpArea:
        property.built_up_area ??
        property.specifications
          ?.builtUpArea ??
        "",

      PlotArea:
        property.plot_area ??
        property.specifications
          ?.plotArea ??
        "",

      Furnishing:
        property.furnishing ?? "",

      Description:
        property.description ?? "",

      Created:
        property.created_at ?? "",
    })
  )

  const workbook =
    XLSX.utils.book_new()

  const sheet =
    XLSX.utils.json_to_sheet(rows)

  XLSX.utils.book_append_sheet(
    workbook,
    sheet,
    "Properties"
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
        'attachment; filename="The_Address_Co_Properties.xlsx"',
    },
  })
}