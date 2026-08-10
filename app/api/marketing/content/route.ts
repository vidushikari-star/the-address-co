import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { ContentUpdateSchema, CreateContentSchema } from "@/lib/marketing/schemas"

export const runtime = "nodejs"

export async function GET(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const { searchParams } = new URL(request.url)
  const content = await MarketingRepository.listContent({
    status: searchParams.get("status") as never ?? undefined,
    propertyId: searchParams.get("propertyId") ?? undefined,
    search: searchParams.get("search") ?? undefined,
  })
  return NextResponse.json({ content })
}

export async function POST(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const parsed = CreateContentSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid content request.", details: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const property = await MarketingRepository.getPropertySnapshot(parsed.data.propertyId)
    if (!property) return NextResponse.json({ error: "Property not found." }, { status: 404 })

    const existing = await MarketingRepository.getContentByIdempotencyKey(parsed.data.idempotencyKey)
    if (existing) return NextResponse.json({ content: existing.content, duplicate: true })

    const account = await MarketingRepository.getInstagramAccount()
    const content = await MarketingRepository.createContent({
      contentType: parsed.data.contentType,
      creativeDirection: parsed.data.creativeDirection,
      property,
      accountId: account?.id,
      createdBy: access.user.id,
      idempotencyKey: parsed.data.idempotencyKey,
    })
    await MarketingRepository.addSourceAssets(content.id, property)
    await MarketingRepository.addAuditLog({
      actorId: access.user.id,
      contentId: content.id,
      action: "content.created",
      metadata: { contentType: content.contentType, propertyId: property.id },
    })

    return NextResponse.json({ content }, { status: 202 })
  } catch (error) {
    console.error("Marketing content creation failed:", error)
    return NextResponse.json({ error: "Unable to create marketing content." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const body = await request.json().catch(() => null) as { id?: string } | null
  if (!body?.id) return NextResponse.json({ error: "Content ID is required." }, { status: 400 })
  const parsed = ContentUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid content changes." }, { status: 400 })

  const current = await MarketingRepository.getContentById(body.id)
  if (!current) return NextResponse.json({ error: "Content not found." }, { status: 404 })
  if (["approved", "scheduled", "blocked_connection", "publishing", "published"].includes(current.content.status)) {
    return NextResponse.json({ error: "Approved, scheduled, and published content is locked. Request changes before editing." }, { status: 409 })
  }

  const fieldMap = {
    caption: "caption",
    shortCaption: "short_caption",
    headline: "headline",
    hook: "hook",
    cta: "cta",
    hashtags: "hashtags",
    composition: "composition",
  } as const
  const changes = Object.fromEntries(Object.entries(parsed.data)
    .map(([key, value]) => [fieldMap[key as keyof typeof fieldMap], value])
    .filter(([key]) => Boolean(key)))
  // A failed item may have a prior approval. Any subsequent material edit must
  // restart the human-review path rather than allowing that old approval to be reused.
  if (current.content.status === "failed") {
    changes.status = "draft"
    changes.last_error = null
  }

  const content = await MarketingRepository.updateContent(body.id, changes, access.user.id)
  await MarketingRepository.addAuditLog({
    actorId: access.user.id,
    contentId: body.id,
    action: "content.edited",
    metadata: { fields: Object.keys(changes) },
  })
  return NextResponse.json({ content })
}
