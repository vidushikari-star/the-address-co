import { NextResponse } from "next/server"

import { MarketingWorkerService } from "@/lib/marketing/services/marketing-worker-service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Invoke from a protected platform cron every minute; it is never browser callable. */
export async function POST(request: Request) {
  const secret = process.env.MARKETING_CRON_SECRET
  const authorization = request.headers.get("authorization")
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await MarketingWorkerService.run(3)
    return NextResponse.json({ result })
  } catch (error) {
    console.error("Marketing worker failed:", error)
    return NextResponse.json({ error: "Marketing worker failed." }, { status: 500 })
  }
}
