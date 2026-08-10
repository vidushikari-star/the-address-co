import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { BulkDeleteDraftsSchema } from "@/lib/marketing/schemas"

/** Bulk deletion accepts draft IDs only. It deliberately rejects a mixed selection rather than skipping records silently. */
export async function POST(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const parsed = BulkDeleteDraftsSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Choose one or more draft items to delete." }, { status: 400 })

  try {
    const deletedIds = await MarketingRepository.deleteDraftContents(parsed.data.ids)
    await MarketingRepository.addAuditLog({
      actorId: access.user.id,
      action: "content.drafts_bulk_deleted",
      metadata: { contentIds: deletedIds, count: deletedIds.length },
    })
    return NextResponse.json({ deletedIds, count: deletedIds.length })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Drafts could not be deleted." }, { status: 409 })
  }
}
