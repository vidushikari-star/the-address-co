import { beforeEach, describe, expect, it, vi } from "vitest"

const repository = vi.hoisted(() => ({
  getContentById: vi.fn(), listReelVersions: vi.fn(), createReelVersion: vi.fn(), markReelVersionRendered: vi.fn(),
  updateDraftReelVersion: vi.fn(), updateContent: vi.fn(), getBrandSettings: vi.fn(), getActiveBrandLogo: vi.fn(), addAuditLog: vi.fn(),
}))
const creative = vi.hoisted(() => ({ improveReelStoryboard: vi.fn() }))

vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))
vi.mock("@/lib/marketing/services/creative-ai-service", () => ({ CreativeAIService: creative }))

import { ReelVersionService } from "@/lib/marketing/services/reel-version-service"
import type { MarketingReelVersion, ReelComposition } from "@/lib/marketing/types"

const contentId = "1e149a39-7321-42d1-900c-7389c0da37a3"
const sourceAssetId = "b2041f1f-89e9-4a59-a8de-00169502f523"
const renderedAssetId = "ba3fe72a-dfb7-43e5-9d81-964c6602ea6a"
const audioTrackId = "0cdbcd65-a87c-4cfe-9196-32e4a3e3b0ec"

function composition(audio: ReelComposition["audio"] = { type: "none", label: "Silent Reel" }): ReelComposition {
  return {
    propertyId: contentId, format: "reel", aspectRatio: "9:16", duration: 10,
    scenes: [{ assetId: sourceAssetId, start: 0, duration: 10, crop: "cover", motion: "slow_zoom", transitionOut: "fade" }],
    caption: "A considered introduction.", hashtags: ["#NorthGoa"], cta: "Arrange a viewing.", coverText: "Villa Verde", audio,
  }
}

function draft(overrides: Partial<MarketingReelVersion> = {}): MarketingReelVersion {
  const draftComposition = composition()
  return {
    id: "version-2", contentId, versionNumber: 2, status: "draft", isCurrent: false, composition: draftComposition,
    sourceAssetIds: [sourceAssetId], logoSettings: null, audioSettings: draftComposition.audio, renderedAssetId: null,
    userPrompt: "Audio updated", lastError: null, createdAt: "2026-08-11T00:00:00.000Z", createdBy: "admin-1", approvedAt: null, renderedAt: null, ...overrides,
  }
}

function record(status: "approved" | "ready_for_review" = "approved") {
  return {
    content: { id: contentId, contentType: "reel", status, composition: composition(), creative: {}, propertySnapshot: { id: contentId }, hashtags: [], creativeDirection: "minimal" },
    assets: [
      { id: sourceAssetId, kind: "original_reference", mediaType: "image", sourceUrl: "https://example.com/source.jpg" },
      { id: renderedAssetId, kind: "rendered_media", mediaType: "video", storagePath: "content/rendered/v1.mp4" },
    ],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  repository.getContentById.mockResolvedValue(record())
  repository.listReelVersions.mockResolvedValue([])
  repository.createReelVersion
    .mockResolvedValueOnce({ id: "version-1", versionNumber: 1 })
    .mockResolvedValueOnce({ ...draft(), id: "version-2", versionNumber: 2 })
  repository.markReelVersionRendered.mockResolvedValue(undefined)
  repository.updateContent.mockResolvedValue({ id: contentId, status: "ready_for_review" })
  repository.getBrandSettings.mockResolvedValue({ preferredTone: "minimal", preferredCta: null, defaultHashtags: [], excludedWords: [], defaultReelLogoPlacement: "none", defaultReelLogoScale: "small", defaultReelLogoOpacity: 0.65 })
  repository.getActiveBrandLogo.mockResolvedValue(null)
  repository.addAuditLog.mockResolvedValue(undefined)
  creative.improveReelStoryboard.mockResolvedValue({
    hook: "A calmer opening", scenes: [{ assetId: sourceAssetId, overlayText: "Villa Verde", durationSeconds: 6, overlayPosition: "top_left", overlayType: "hook" }], endCard: { headline: "Villa Verde", cta: "Arrange a viewing." },
  })
})

describe("ReelVersionService.setAudio", () => {
  it("preserves a legacy rendered Reel and creates a separate audio draft that requires re-approval", async () => {
    const result = await ReelVersionService.setAudio({
      contentId, adminId: "admin-1", audio: { type: "uploaded", id: audioTrackId, label: "Licensed piano", durationSeconds: 30 },
    })

    expect(repository.createReelVersion).toHaveBeenNthCalledWith(1, expect.objectContaining({ status: "rendered", composition: expect.objectContaining({ audio: { type: "none", label: "Silent Reel" } }) }))
    expect(repository.markReelVersionRendered).toHaveBeenCalledWith({ id: "version-1", renderedAssetId, makeCurrent: true })
    expect(repository.createReelVersion).toHaveBeenNthCalledWith(2, expect.objectContaining({ status: "draft", audioSettings: { type: "uploaded", id: audioTrackId, label: "Licensed piano", durationSeconds: 30 } }))
    expect(repository.updateContent).toHaveBeenCalledWith(contentId, expect.objectContaining({ status: "ready_for_review", composition: expect.objectContaining({ audio: expect.objectContaining({ id: audioTrackId }) }) }), "admin-1")
    expect(result).toMatchObject({ createdDraft: true, version: { id: "version-2" } })
  })

  it("updates the existing editable draft for Silent Reel without touching historical rendered versions", async () => {
    const existingDraft = draft()
    repository.listReelVersions.mockResolvedValue([existingDraft])
    repository.updateDraftReelVersion.mockResolvedValue({ ...existingDraft, composition: composition({ type: "none", label: "Silent Reel" }) })

    const result = await ReelVersionService.setAudio({ contentId, adminId: "admin-1", audio: { type: "none", label: "Silent Reel" } })

    expect(repository.createReelVersion).not.toHaveBeenCalled()
    expect(repository.updateDraftReelVersion).toHaveBeenCalledWith(expect.objectContaining({ id: "version-2", audioSettings: { type: "none", label: "Silent Reel" } }))
    expect(result.createdDraft).toBe(false)
  })

  it("creates an AI-improved draft version without overwriting the prior rendered version", async () => {
    const result = await ReelVersionService.improve({ contentId, adminId: "admin-1", prompt: "Use less text and focus on the pool." })

    expect(repository.createReelVersion).toHaveBeenNthCalledWith(1, expect.objectContaining({ status: "rendered", userPrompt: "Initial Reel version" }))
    expect(repository.markReelVersionRendered).toHaveBeenCalledWith({ id: "version-1", renderedAssetId, makeCurrent: true })
    expect(repository.createReelVersion).toHaveBeenNthCalledWith(2, expect.objectContaining({ status: "draft", userPrompt: "Use less text and focus on the pool." }))
    expect(repository.updateContent).toHaveBeenCalledWith(contentId, expect.objectContaining({ status: "ready_for_review", composition: expect.objectContaining({ scenes: expect.any(Array) }) }), "admin-1")
    expect(result).toMatchObject({ id: "version-2", versionNumber: 2 })
  })
})
