import { NextResponse } from "next/server"

import { syncHousingLeads } from "@/lib/integrations/housing/sync"

export async function GET(request: Request) {
  const apiKey =
    process.env.HOUSING_SYNC_API_KEY ??
    process.env.HOUSING_LEAD_WEBHOOK_API_KEY
  const authorization = request.headers.get("authorization")

  if (!apiKey || authorization !== `Bearer ${apiKey}`) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const result = await syncHousingLeads()

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("Housing sync pull failed:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
