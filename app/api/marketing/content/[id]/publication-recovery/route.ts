import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

type Context = { params: Promise<{ id: string }> }

/**
 * This recovery path never calls Meta and is deliberately narrower than a
 * retry: the database rejects every record for which media_publish may have
 * succeeded, so returning to Approved cannot create a duplicate post.
 */
export async function POST(_request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  try {
    const { id } = await context.params
    const content = await MarketingRepository.returnPublicationToApproved({ contentId: id, updatedBy: access.user.id })
    revalidatePath("/marketing/content")
    revalidatePath("/marketing/calendar")
    return NextResponse.json({ content })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "This publication cannot be returned to Approved safely." }, { status: 409 })
  }
}
