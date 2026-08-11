import { beforeEach, describe, expect, it, vi } from "vitest"

const repository = vi.hoisted(() => ({
  getContentById: vi.fn(),
  transitionContent: vi.fn().mockResolvedValue({ id: "content-1", status: "approved" }),
  addApproval: vi.fn().mockResolvedValue(undefined),
  addAuditLog: vi.fn().mockResolvedValue(undefined),
  upsertSchedule: vi.fn().mockResolvedValue(undefined),
  enqueueJob: vi.fn().mockResolvedValue(undefined),
  getInstagramAccount: vi.fn().mockResolvedValue(null),
  approveNewestDraftReelVersion: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))

import { ApprovalService } from "@/lib/marketing/services/approval-service"
import { SchedulerService } from "@/lib/marketing/services/scheduler-service"

const completeCopy = {
  headline: "Villa Verde, Parra",
  hook: "Discover Villa Verde.",
  caption: "Discover Villa Verde in Parra, Goa.",
  cta: "Arrange a private viewing.",
  hashtags: ["#NorthGoa"],
}

function record(status: string, contentType = "single_image", assets = [{ kind: "original_reference", mediaType: "image", sourceUrl: "https://images.example/villa.jpg" }]) {
  return {
    content: { id: "content-1", status, contentType, composition: {}, ...completeCopy },
    assets,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  repository.transitionContent.mockResolvedValue({ id: "content-1", status: "approved" })
  repository.getContentById.mockResolvedValue(record("approved"))
  repository.getInstagramAccount.mockResolvedValue(null)
  vi.stubEnv("INSTAGRAM_PUBLISHING_ENABLED", "false")
})

describe("approval and scheduling guards", () => {
  it("allows an admin to approve a complete single-image draft without audio and persists approval metadata", async () => {
    repository.getContentById.mockResolvedValue(record("draft"))

    await ApprovalService.approve("content-1", "admin-1", "Looks good")

    expect(repository.transitionContent).toHaveBeenCalledWith(expect.objectContaining({
      id: "content-1",
      from: ["draft", "ready_for_review", "changes_requested"],
      to: "approved",
      updatedBy: "admin-1",
    }))
    expect(repository.addApproval).toHaveBeenCalledWith(expect.objectContaining({
      contentId: "content-1",
      decision: "approved",
      decidedBy: "admin-1",
    }))
  })

  it("approves the newest regenerated Reel version only after the content review succeeds", async () => {
    repository.getContentById.mockResolvedValue(record("ready_for_review", "reel"))
    repository.transitionContent.mockResolvedValue({ id: "content-1", status: "approved", contentType: "reel" })

    await ApprovalService.approve("content-1", "admin-1")

    expect(repository.approveNewestDraftReelVersion).toHaveBeenCalledWith("content-1", "admin-1")
  })

  it("schedules an approved single-image item using its original CRM image without FFmpeg rendering", async () => {
    const scheduledFor = new Date(Date.now() + 3_600_000).toISOString()

    await SchedulerService.schedule({ contentId: "content-1", scheduledFor, timezone: "Asia/Kolkata", adminId: "admin-1" })

    expect(repository.transitionContent).toHaveBeenCalledWith(expect.objectContaining({ from: "approved", to: "scheduled" }))
    expect(repository.upsertSchedule).toHaveBeenCalledWith(expect.objectContaining({ scheduledFor, timezone: "Asia/Kolkata", createdBy: "admin-1" }))
    expect(repository.enqueueJob).toHaveBeenCalledWith(expect.objectContaining({ type: "publish_instagram", runAfter: scheduledFor }))
  })

  it("does not schedule a draft", async () => {
    repository.getContentById.mockResolvedValue(record("draft"))

    await expect(SchedulerService.schedule({
      contentId: "content-1",
      scheduledFor: new Date(Date.now() + 3_600_000).toISOString(),
      timezone: "Asia/Kolkata",
      adminId: "admin-1",
    })).rejects.toThrow("Only approved content can be scheduled")
    expect(repository.transitionContent).not.toHaveBeenCalled()
  })

  it("does not schedule an approved Reel until its render succeeds", async () => {
    repository.getContentById.mockResolvedValue(record("approved", "reel"))

    await expect(SchedulerService.schedule({
      contentId: "content-1",
      scheduledFor: new Date(Date.now() + 3_600_000).toISOString(),
      timezone: "Asia/Kolkata",
      adminId: "admin-1",
    })).rejects.toThrow("Required publish media is not ready")
  })

  it("does not schedule failed content", async () => {
    repository.getContentById.mockResolvedValue(record("failed", "reel"))

    await expect(SchedulerService.schedule({
      contentId: "content-1",
      scheduledFor: new Date(Date.now() + 3_600_000).toISOString(),
      timezone: "Asia/Kolkata",
      adminId: "admin-1",
    })).rejects.toThrow("Only approved content can be scheduled")
  })

  it("requires the connected professional account before scheduling when publishing is enabled", async () => {
    vi.stubEnv("INSTAGRAM_PUBLISHING_ENABLED", "true")

    await expect(SchedulerService.schedule({
      contentId: "content-1",
      scheduledFor: new Date(Date.now() + 3_600_000).toISOString(),
      timezone: "Asia/Kolkata",
      adminId: "admin-1",
    })).rejects.toThrow("Connect an Instagram professional account")

    repository.getInstagramAccount.mockResolvedValue({ id: "other-account", status: "connected" })
    repository.getContentById.mockResolvedValue({ content: { ...record("approved").content, accountId: "expected-account" }, assets: record("approved").assets })
    await expect(SchedulerService.schedule({
      contentId: "content-1",
      scheduledFor: new Date(Date.now() + 3_600_000).toISOString(),
      timezone: "Asia/Kolkata",
      adminId: "admin-1",
    })).rejects.toThrow("selected Instagram account is no longer connected")
  })

  it("returns an approved item to changes before material edits", async () => {
    await ApprovalService.requestChanges("content-1", "admin-1", "Update the CTA")

    expect(repository.transitionContent).toHaveBeenCalledWith(expect.objectContaining({
      from: ["ready_for_review", "approved"],
      to: "changes_requested",
      updatedBy: "admin-1",
    }))
    expect(repository.addApproval).toHaveBeenCalledWith(expect.objectContaining({ decision: "changes_requested" }))
  })
})
