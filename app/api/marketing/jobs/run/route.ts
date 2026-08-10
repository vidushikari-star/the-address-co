import { NextResponse } from "next/server"

import { MarketingWorkerService, VERCEL_SAFE_JOB_TYPES } from "@/lib/marketing/services/marketing-worker-service"
import { supabaseProjectRef } from "@/lib/marketing/supabase-project"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Kept as the protected remote runner for API-safe jobs. Render jobs are
 * deliberately excluded: the Railway worker claims those same Supabase jobs
 * directly so FFmpeg never runs in this Vercel function.
 */
export async function POST(request: Request) {
  const secret = process.env.MARKETING_CRON_SECRET
  const authorization = request.headers.get("authorization")
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await MarketingWorkerService.run(3, { jobTypes: VERCEL_SAFE_JOB_TYPES })
    // Safe, non-secret queue identity for the Railway worker's deployment
    // diagnostic. This catches accidental cross-project configuration.
    return NextResponse.json({ result, supabaseProjectRef: supabaseProjectRef() })
  } catch (error) {
    console.error("Marketing worker failed:", error)
    return NextResponse.json({ error: "Marketing worker failed." }, { status: 500 })
  }
}
