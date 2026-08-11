import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { ScheduledContentActionSchema } from "@/lib/marketing/schemas"
import { scheduledContentResultMessage } from "@/lib/marketing/scheduled-content-state"

export async function POST(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  const parsed = ScheduledContentActionSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: "Choose one or more scheduled Marketing items." }, { status: 400 })
  try {
    const outcomes = await MarketingRepository.manageScheduledContents({ ...parsed.data, updatedBy: access.user.id })
    // The protected database mutation is authoritative. An audit-log outage
    // must never turn a completed delete/unschedule into a false client error.
    const auditResults = await Promise.allSettled(outcomes.filter(item => item.outcome === "unscheduled" || item.outcome === "deleted").map(item =>
      MarketingRepository.addAuditLog({ actorId: access.user.id, contentId: item.id, action: parsed.data.action === "unschedule" ? "content.unscheduled" : "content.scheduled_deleted" })
    ))
    const failedAudits = auditResults.filter(result => result.status === "rejected").length
    if (failedAudits) console.error("Marketing scheduled-content audit logging failed:", JSON.stringify({ failedAudits, action: parsed.data.action }))
    return NextResponse.json({ outcomes, message: scheduledContentResultMessage(parsed.data.action, outcomes) })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update the selected scheduled content." }, { status: 400 })
  }
}
