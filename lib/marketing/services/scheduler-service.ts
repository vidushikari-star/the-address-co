import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

export class SchedulerService {
  static async schedule(input: {
    contentId: string
    scheduledFor: string
    timezone: string
    adminId: string
  }) {
    const scheduledFor = new Date(input.scheduledFor)
    if (Number.isNaN(scheduledFor.valueOf()) || scheduledFor <= new Date()) {
      throw new Error("Choose a future publication time.")
    }

    const content = await MarketingRepository.transitionContent({
      id: input.contentId,
      from: "approved",
      to: "scheduled",
      updatedBy: input.adminId,
      changes: { proposed_publish_at: scheduledFor.toISOString() },
    })

    await MarketingRepository.upsertSchedule({
      contentId: input.contentId,
      scheduledFor: scheduledFor.toISOString(),
      timezone: input.timezone,
      createdBy: input.adminId,
    })
    await MarketingRepository.enqueueJob({
      contentId: input.contentId,
      type: "publish_instagram",
      idempotencyKey: `scheduled-publish:${input.contentId}:${scheduledFor.toISOString()}`,
      runAfter: scheduledFor.toISOString(),
    })
    await MarketingRepository.addAuditLog({
      actorId: input.adminId,
      contentId: input.contentId,
      action: "content.scheduled",
      metadata: { scheduledFor: scheduledFor.toISOString(), timezone: input.timezone },
    })

    return content
  }
}
