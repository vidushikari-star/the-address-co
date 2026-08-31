import { beforeEach, describe, expect, it, vi } from "vitest"

const repository = vi.hoisted(() => ({
  getContentById: vi.fn(),
  applyApproval: vi.fn().mockResolvedValue({ id: "content-1", status: "approved" }),
  upsertSchedule: vi.fn().mockResolvedValue(undefined),
  enqueueJob: vi.fn().mockResolvedValue(undefined),
  getInstagramAccount: vi.fn().mockResolvedValue(null),
  listReelVersions: vi.fn().mockResolvedValue([]),
  scheduleApprovedContent: vi.fn().mockResolvedValue({ id: "content-1", status: "scheduled" }),
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

const creativeWithoutProvenance = {
  campaignConcept: "A considered introduction to Villa Verde.",
  hook: "Discover Villa Verde in Parra, Goa.",
  headline: "Villa Verde, Parra",
  caption: "Discover Villa Verde in Parra, Goa.",
  shortCaption: "Villa Verde in Parra, Goa.",
  cta: "Arrange a private viewing.",
  hashtags: ["#NorthGoa"],
  onScreenText: [],
  carouselSlides: [],
  storyCopy: { headline: "Villa Verde", supportingLine: "", highlights: [], priceLine: "", cta: "Arrange a private viewing." },
  coverText: "Villa Verde",
  altText: "Villa Verde in Parra, Goa.",
  suggestedDuration: 30,
  transitions: ["fade"],
  audioStyle: "manual_instagram",
  factsUsed: ["title", "location"],
}

const renderToken = "1e149a39-7321-42d1-900c-7389c0da37a3"
function renderedImage(format = "single_image", sourceAssetId = "asset-1") {
  return { id: `rendered-${sourceAssetId}`, kind: "rendered_media", mediaType: "image", storagePath: `rendered/${sourceAssetId}.jpg`, metadata: { instagramFormat: format, renderToken, sourceAssetId, width: 1080, height: 1350, aspectRatio: "4:5" } }
}
function record(status: string, contentType = "single_image", assets: Array<{ kind: string; mediaType: string; sourceUrl?: string; storagePath?: string; metadata?: Record<string, unknown> }> = [renderedImage()]) {
  return {
    content: { id: "content-1", status, contentType, composition: contentType === "reel" ? {} : { format: contentType, renderToken }, ...completeCopy },
    assets,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  repository.applyApproval.mockResolvedValue({ id: "content-1", status: "approved" })
  repository.getContentById.mockResolvedValue(record("approved"))
  repository.getInstagramAccount.mockResolvedValue(null)
  repository.listReelVersions.mockResolvedValue([])
  repository.scheduleApprovedContent.mockResolvedValue({ id: "content-1", status: "scheduled" })
  vi.stubEnv("INSTAGRAM_PUBLISHING_ENABLED", "false")
  vi.stubEnv("MARKETING_SCHEDULING_ENABLED", "true")
})

describe("approval and scheduling guards", () => {
  it("blocks scheduling completely when the environment safety flag is disabled", async () => {
    vi.stubEnv("MARKETING_SCHEDULING_ENABLED", "false")

    await expect(SchedulerService.schedule({
      contentId: "content-1",
      scheduledFor: new Date(Date.now() + 3_600_000).toISOString(),
      timezone: "Asia/Kolkata",
      adminId: "admin-1",
    })).rejects.toThrow("Marketing scheduling is disabled in this environment")
    expect(repository.scheduleApprovedContent).not.toHaveBeenCalled()
  })

  it("approves a Story from its persisted composition even when the legacy headline column is empty", async () => {
    const sourceAssetId = "34d1e601-18e9-4caa-9cc4-8af4c11888f1"
    const storyToken = "1e149a39-7321-42d1-900c-7389c0da37a3"
    repository.getContentById.mockResolvedValue({
      content: {
        id: "content-1",
        status: "ready_for_review",
        contentType: "story",
        headline: null,
        hashtags: [],
        composition: {
          propertyId: "b2041f1f-89e9-4a59-a8de-00169502f523",
          format: "story",
          aspectRatio: "9:16",
          sourceAssetId,
          storyCopy: { headline: "Villa Verde", supportingLine: "Parra", highlights: [], priceLine: "", cta: "Arrange a viewing" },
          layoutStyle: "editorial_panel",
          typographyStyle: "modern_sans",
          renderToken: storyToken,
          logo: { enabled: false, placement: "top_right", scale: "small", opacity: 0.8 },
        },
      },
      assets: [
        { id: sourceAssetId, kind: "original_reference", mediaType: "image", sourceUrl: "https://images.example/source.jpg", metadata: {} },
        { id: "story-render", kind: "rendered_media", mediaType: "image", storagePath: "rendered/story.jpg", metadata: { instagramFormat: "story", renderToken: storyToken, sourceAssetId, width: 1080, height: 1920, aspectRatio: "9:16" } },
      ],
    })

    await ApprovalService.approve("content-1", "admin-1")

    expect(repository.applyApproval).toHaveBeenCalledWith(expect.objectContaining({ contentId: "content-1", decision: "approved" }))
  })

  it("allows an admin to approve a complete single-image draft through the atomic approval operation", async () => {
    repository.getContentById.mockResolvedValue(record("draft"))

    await ApprovalService.approve("content-1", "admin-1", "Looks good")

    expect(repository.applyApproval).toHaveBeenCalledWith(expect.objectContaining({
      contentId: "content-1",
      decision: "approved",
      decidedBy: "admin-1",
    }))
  })

  it("does not block approval because legacy creative has no claim provenance", async () => {
    const source = record("draft")
    repository.getContentById.mockResolvedValue({
      ...source,
      content: {
        ...source.content,
        propertySnapshot: {
          id: "property-1",
          title: "Villa Verde",
          location: "Parra, Goa",
          bedrooms: 4,
          amenities: [],
          features: [],
          media: [],
        },
        creative: creativeWithoutProvenance,
      },
    })

    await ApprovalService.approve("content-1", "admin-1")

    expect(repository.applyApproval).toHaveBeenCalledWith(expect.objectContaining({
      contentId: "content-1",
      decision: "approved",
    }))
  })

  it("keeps a Reel approval in the same database operation as its newest draft version", async () => {
    repository.getContentById.mockResolvedValue(record("ready_for_review", "reel", [{ kind: "rendered_media", mediaType: "video", storagePath: "rendered/v1.mp4", metadata: { format: "1080x1920-h264-mp4", width: 1080, height: 1920, aspectRatio: "9:16" } }]))

    await ApprovalService.approve("content-1", "admin-1")

    expect(repository.applyApproval).toHaveBeenCalledWith(expect.objectContaining({
      contentId: "content-1",
      decision: "approved",
    }))
  })

  it("schedules an approved single-image item only after its 4:5 derivative is ready", async () => {
    const scheduledFor = new Date(Date.now() + 3_600_000).toISOString()

    await SchedulerService.schedule({ contentId: "content-1", scheduledFor, timezone: "Asia/Kolkata", adminId: "admin-1" })

    expect(repository.scheduleApprovedContent).toHaveBeenCalledWith(expect.objectContaining({ contentId: "content-1", scheduledFor, timezone: "Asia/Kolkata", createdBy: "admin-1" }))
  })

  it("does not schedule a draft", async () => {
    repository.getContentById.mockResolvedValue(record("draft"))

    await expect(SchedulerService.schedule({
      contentId: "content-1",
      scheduledFor: new Date(Date.now() + 3_600_000).toISOString(),
      timezone: "Asia/Kolkata",
      adminId: "admin-1",
    })).rejects.toThrow("Only approved content can be scheduled")
    expect(repository.applyApproval).not.toHaveBeenCalled()
  })

  it("does not schedule an approved Reel until its render succeeds", async () => {
    repository.getContentById.mockResolvedValue(record("approved", "reel"))

    await expect(SchedulerService.schedule({
      contentId: "content-1",
      scheduledFor: new Date(Date.now() + 3_600_000).toISOString(),
      timezone: "Asia/Kolkata",
      adminId: "admin-1",
    })).rejects.toThrow("Rendered Reel MP4 is missing")
  })

  it("schedules an approved Carousel only from its ordered matching rendered children", async () => {
    const assets = [0, 1, 2, 3, 4].map(index => ({
      id: `asset-${index}`,
      kind: "original_reference",
      mediaType: "image",
      sourceUrl: `https://images.example/villa-${index}.jpg`,
      sortOrder: index,
      createdAt: "2026-08-10T00:00:00.000Z",
      metadata: { isCover: index === 0 },
    }))
    repository.getContentById.mockResolvedValue({
      content: { ...record("approved", "carousel").content, composition: { format: "carousel", selectedAssetIds: assets.map(asset => asset.id), renderToken } },
      assets: [...assets, ...assets.map((asset, index) => ({ ...renderedImage("carousel", asset.id), sortOrder: index }))],
    })
    const scheduledFor = new Date(Date.now() + 3_600_000).toISOString()

    await SchedulerService.schedule({ contentId: "content-1", scheduledFor, timezone: "Asia/Kolkata", adminId: "admin-1" })

    expect(repository.listReelVersions).not.toHaveBeenCalled()
    expect(repository.scheduleApprovedContent).toHaveBeenCalledWith(expect.objectContaining({ contentId: "content-1", scheduledFor }))
  })

  it("keeps an invalid Carousel approved and returns an actionable media error", async () => {
    repository.getContentById.mockResolvedValue({
      content: { ...record("approved", "carousel").content, composition: { format: "carousel", selectedAssetIds: ["missing-asset", "asset-2"] } },
      assets: [{ id: "asset-2", kind: "original_reference", mediaType: "image", sourceUrl: "https://images.example/2.jpg", sortOrder: 2, createdAt: "2026-08-10T00:00:00.000Z", metadata: {} }],
    })

    await expect(SchedulerService.schedule({
      contentId: "content-1", scheduledFor: new Date(Date.now() + 3_600_000).toISOString(), timezone: "Asia/Kolkata", adminId: "admin-1",
    })).rejects.toThrow("1 selected image could not be resolved")
    expect(repository.scheduleApprovedContent).not.toHaveBeenCalled()
  })

  it("does not schedule the old active Reel while a newer approved version awaits rendering", async () => {
    repository.getContentById.mockResolvedValue(record("approved", "reel", [{ kind: "rendered_media", mediaType: "video", storagePath: "rendered/v1.mp4", metadata: { format: "1080x1920-h264-mp4", width: 1080, height: 1920, aspectRatio: "9:16" } }]))
    repository.listReelVersions.mockResolvedValue([{ id: "version-2", status: "approved", renderedAssetId: null }])

    await expect(SchedulerService.schedule({
      contentId: "content-1",
      scheduledFor: new Date(Date.now() + 3_600_000).toISOString(),
      timezone: "Asia/Kolkata",
      adminId: "admin-1",
    })).rejects.toThrow("Render the approved new Reel version")
    expect(repository.applyApproval).not.toHaveBeenCalled()
  })

  it("blocks approval and scheduling when a legacy Carousel selected a video", async () => {
    const assets = [
      { id: "asset-image", kind: "original_reference", mediaType: "image", sourceUrl: "https://images.example/cover.jpg", sortOrder: 0, createdAt: "2026-08-10T00:00:00.000Z", metadata: {} },
      { id: "asset-video", kind: "original_reference", mediaType: "video", sourceUrl: "https://images.example/tour.mp4", sortOrder: 1, createdAt: "2026-08-10T00:00:00.000Z", metadata: {} },
    ]
    repository.getContentById.mockResolvedValue({
      content: { ...record("draft", "carousel").content, composition: { format: "carousel", selectedAssetIds: assets.map(asset => asset.id) } },
      assets,
    })

    await expect(ApprovalService.approve("content-1", "admin-1"))
      .rejects.toThrow("This Carousel contains unsupported video media")
    expect(repository.applyApproval).not.toHaveBeenCalled()

    repository.getContentById.mockResolvedValue({
      content: { ...record("approved", "carousel").content, composition: { format: "carousel", selectedAssetIds: assets.map(asset => asset.id) } },
      assets,
    })
    await expect(SchedulerService.schedule({
      contentId: "content-1", scheduledFor: new Date(Date.now() + 3_600_000).toISOString(), timezone: "Asia/Kolkata", adminId: "admin-1",
    })).rejects.toThrow("This Carousel contains unsupported video media")
    expect(repository.scheduleApprovedContent).not.toHaveBeenCalled()
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

    expect(repository.applyApproval).toHaveBeenCalledWith(expect.objectContaining({
      contentId: "content-1",
      decision: "changes_requested",
      note: "Update the CTA",
      decidedBy: "admin-1",
    }))
  })
})
