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
    const name = error && typeof error === "object" && "name" in error ? String(error.name) : "UnknownError"
    console.error("Housing sync pull failed", { name })

    return NextResponse.json(
      {
        success: false,
        error: "Housing lead sync could not be completed. Please retry; if it persists, check the integration logs.",
      },
      { status: 500 }
    )
  }
}
