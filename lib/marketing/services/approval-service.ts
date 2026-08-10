import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import type { MarketingStatus } from "@/lib/marketing/types"

const APPROVABLE: MarketingStatus[] = ["ready_for_review", "changes_requested"]

export class ApprovalService {
  static async approve(contentId: string, adminId: string, note?: string) {
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
