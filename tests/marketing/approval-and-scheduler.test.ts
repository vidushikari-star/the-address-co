import { describe, expect, it, vi } from "vitest"

const repository = vi.hoisted(() => ({
  transitionContent: vi.fn().mockResolvedValue({ id: "content-1", status: "approved" }),
  addApproval: vi.fn().mockResolvedValue(undefined),
  addAuditLog: vi.fn().mockResolvedValue(undefined),
  upsertSchedule: vi.fn().mockResolvedValue(undefined),
  enqueueJob: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))

import { ApprovalService } from "@/lib/marketing/services/approval-service"
import { SchedulerService } from "@/lib/marketing/services/scheduler-service"

describe("approval and scheduling guards", () => {
  it("records an explicit admin decision before content can be approved", async () => {
    await ApprovalService.approve("content-1", "admin-1", "Looks good")
    expect(repository.transitionContent).toHaveBeenCalledWith(expect.objectContaining({
      id: "content-1",
      from: ["ready_for_review", "changes_requested"],
      to: "approved",
      updatedBy: "admin-1",
    }))
    expect(repository.addApproval).toHaveBeenCalledWith(expect.objectContaining({ decision: "approved", decidedBy: "admin-1" }))
  })

  it("schedules only from the approved state and queues a background publish job", async () => {
    const scheduledFor = new Date(Date.now() + 3_600_000).toISOString()
    await SchedulerService.schedule({ contentId: "content-1", scheduledFor, timezone: "Asia/Kolkata", adminId: "admin-1" })
    expect(repository.transitionContent).toHaveBeenCalledWith(expect.objectContaining({ from: "approved", to: "scheduled" }))
    expect(repository.enqueueJob).toHaveBeenCalledWith(expect.objectContaining({ type: "publish_instagram", runAfter: scheduledFor }))
  })
})
