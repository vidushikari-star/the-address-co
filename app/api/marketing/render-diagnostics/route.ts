import { NextResponse } from "next/server"
import { z } from "zod"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { RenderService } from "@/lib/marketing/services/render-service"

export const runtime = "nodejs"

const RequestSchema = z.object({ contentId: z.string().uuid().optional() })

/**
 * Intentionally operator-triggered. It does not run during a normal worker
 * cycle and leaves no media or database records behind.
 */
export async function POST(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const parsed = RequestSchema.safeParse(await request.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Invalid render diagnostic request." }, { status: 400 })

  let sourceAsset = null
  if (parsed.data.contentId) {
    const record = await MarketingRepository.getContentById(parsed.data.contentId)
    if (!record) return NextResponse.json({ error: "Content not found." }, { status: 404 })
    sourceAsset = record.assets.find(asset => asset.kind === "original_reference" && asset.mediaType === "image" && Boolean(asset.sourceUrl)) ?? null
  }
  const diagnostic = await RenderService.runEnvironmentSelfTest({ sourceAsset })
  return NextResponse.json({ diagnostic, sourceImageIncluded: Boolean(sourceAsset) })
}
