import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import type { MarketingStatus } from "@/lib/marketing/types"

const APPROVABLE: MarketingStatus[] = ["draft", "ready_for_review", "changes_requested"]

function hasReviewableCopy(content: {
  headline?: string | null
  hook?: string | null
  caption?: string | null
  cta?: string | null
  hashtags: string[]
}) {
  return Boolean(
    content.headline?.trim() && content.hook?.trim() && content.caption?.trim() &&
    content.cta?.trim() && content.hashtags.length
  )
}

export class ApprovalService {
  static async approve(contentId: string, adminId: string, note?: string) {
    const record = await MarketingRepository.getContentById(contentId)
    if (!record) throw new Error("Content not found.")
    if (!hasReviewableCopy(record.content)) {
      throw new Error("Generate or complete headline, hook, caption, CTA, and hashtags before approval.")
    }

    const content = await MarketingRepository.transitionContent({
      id: contentId,
      from: APPROVABLE,
      to: "approved",
      updatedBy: adminId,
    })
    await MarketingRepository.addApproval({
      contentId,
      decision: "approved",
      note,
      decidedBy: adminId,
    })
    if (content.contentType === "reel") {
      await MarketingRepository.approveNewestDraftReelVersion(contentId, adminId)
    }
    await MarketingRepository.addAuditLog({
      actorId: adminId,
      contentId,
      action: "content.approved",
    })
    return content
  }

  static async requestChanges(contentId: string, adminId: string, note?: string) {
    const content = await MarketingRepository.transitionContent({
      id: contentId,
      from: ["ready_for_review", "approved"],
      to: "changes_requested",
      updatedBy: adminId,
      changes: { rejection_reason: note ?? null },
    })
    await MarketingRepository.addApproval({
      contentId,
      decision: "changes_requested",
      note,
      decidedBy: adminId,
    })
    await MarketingRepository.addAuditLog({
      actorId: adminId,
      contentId,
      action: "content.changes_requested",
      metadata: { note: note ?? null },
    })
    return content
  }

  static async reject(contentId: string, adminId: string, note?: string) {
    const content = await MarketingRepository.transitionContent({
      id: contentId,
      from: ["ready_for_review", "changes_requested", "approved"],
      to: "draft",
      updatedBy: adminId,
      changes: { rejection_reason: note ?? "Rejected by administrator." },
    })
    await MarketingRepository.addApproval({
      contentId,
      decision: "rejected",
      note,
      decidedBy: adminId,
    })
    await MarketingRepository.addAuditLog({
      actorId: adminId,
      contentId,
      action: "content.rejected",
      metadata: { note: note ?? null },
    })
    return content
  }
}
