import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

type Context = { params: Promise<{ id: string }> }

/** Draft deletion is intentionally narrow: it never deletes property originals or approved content. */
export async function DELETE(_request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const { id } = await context.params
  const record = await MarketingRepository.getContentById(id)
  if (!record) return NextResponse.json({ error: "Content not found." }, { status: 404 })
  if (record.content.status !== "draft") {
    return NextResponse.json({ error: "Only draft content can be deleted." }, { status: 409 })
  }

  try {
    await MarketingRepository.deleteDraftContent(id)
    await MarketingRepository.addAuditLog({
      actorId: access.user.id,
      action: "content.draft_deleted",
      metadata: { contentId: id, propertyId: record.content.primaryPropertyId },
    })
    return NextResponse.json({ deleted: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Draft could not be deleted." }, { status: 409 })
  }
}
