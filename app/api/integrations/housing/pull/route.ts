import { NextResponse } from "next/server"

import { syncHousingLeads } from "@/lib/integrations/housing/sync"

export async function GET() {
  console.log("🚀 Route started")

  try {
    console.log("📥 About to call syncHousingLeads")

    const result = await syncHousingLeads()

    console.log("✅ syncHousingLeads returned:", result)

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("❌ Route error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}