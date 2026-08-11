import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { ScheduledContentActionSchema } from "@/lib/marketing/schemas"

function resultMessage(action: "unschedule" | "delete", outcomes: Array<{ outcome: string }>) {
  const complete = outcomes.filter(item => item.outcome === (action === "unschedule" ? "unscheduled" : "deleted")).length
  const publishing = outcomes.filter(item => item.outcome === "skipped_publishing").length
  const blocked = outcomes.length - complete - publishing
  const actionLabel = action === "unschedule" ? "scheduled items unscheduled" : "items deleted"
  const suffix = [publishing ? `${publishing} skipped because publishing had already started` : "", blocked ? `${blocked} skipped because they were no longer safely deletable` : ""].filter(Boolean).join(". ")
  return `${complete} ${actionLabel}${suffix ? `. ${suffix}.` : ""}`
}

export async function POST(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const parsed = ScheduledContentActionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Choose one or more scheduled Marketing items." }, { status: 400 })
  try {
    const outcomes = await MarketingRepository.manageScheduledContents({ ...parsed.data, updatedBy: access.user.id })
    await Promise.all(outcomes.filter(item => item.outcome === "unscheduled" || item.outcome === "deleted").map(item =>
      MarketingRepository.addAuditLog({ actorId: access.user.id, contentId: item.id, action: parsed.data.action === "unschedule" ? "content.unscheduled" : "content.scheduled_deleted" })
    ))
    return NextResponse.json({ outcomes, message: resultMessage(parsed.data.action, outcomes) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update the selected scheduled content." }, { status: 400 })
  }
}
