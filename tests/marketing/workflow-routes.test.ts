import { beforeEach, describe, expect, it, vi } from "vitest"

const access = vi.hoisted(() => ({ requireMarketingApiAccess: vi.fn() }))
const flags = vi.hoisted(() => ({ isInstagramPublishingEnabled: vi.fn() }))
const repository = vi.hoisted(() => ({ getContentById: vi.fn(), getPropertySnapshot: vi.fn(), enqueueJob: vi.fn(), queueStaticRender: vi.fn(), queueReelRender: vi.fn(), addAuditLog: vi.fn(), getBrandSettings: vi.fn(), getActiveBrandLogo: vi.fn(), updateContent: vi.fn() }))
const creativeAi = vi.hoisted(() => ({ improveStoryCopy: vi.fn() }))

vi.mock("@/lib/auth/marketing", () => access)
vi.mock("@/lib/marketing/feature-flags", () => flags)
vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))
vi.mock("@/lib/marketing/services/creative-ai-service", () => ({ CreativeAIService: creativeAi }))
vi.mock("@/lib/marketing/services/approval-service", () => ({ ApprovalService: { approve: vi.fn(), requestChanges: vi.fn(), reject: vi.fn() } }))

import { POST as approve } from "@/app/api/marketing/content/[id]/approval/route"
import { PATCH as edit } from "@/app/api/marketing/content/route"
import { POST as publish } from "@/app/api/marketing/publish/[id]/route"
import { POST as render } from "@/app/api/marketing/content/[id]/render/route"
import { PATCH as updateStory } from "@/app/api/marketing/content/[id]/story/route"
import { POST as improveStory } from "@/app/api/marketing/content/[id]/story/route"

beforeEach(() => {
  vi.clearAllMocks()
  access.requireMarketingApiAccess.mockResolvedValue({ user: { id: "admin-1" }, error: null, status: null })
  flags.isInstagramPublishingEnabled.mockReturnValue(false)
  repository.getBrandSettings.mockResolvedValue({ defaultReelLogoPlacement: "none", defaultReelLogoScale: "small", defaultReelLogoOpacity: 0.65 })
  repository.getActiveBrandLogo.mockResolvedValue(null)
  repository.updateContent.mockResolvedValue({})
})

describe("Marketing workflow API guards", () => {
  it("does not let a non-admin approve content", async () => {
    access.requireMarketingApiAccess.mockResolvedValue({ user: null, error: "Forbidden", status: 403 })

    const response = await approve(
      new Request("http://localhost/api/marketing/content/content-1/approval", { method: "POST", body: JSON.stringify({ action: "approve" }) }),
      { params: Promise.resolve({ id: "content-1" }) }
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "Forbidden" })
  })

  it("keeps publishing blocked while INSTAGRAM_PUBLISHING_ENABLED is false", async () => {
    const response = await publish(
      new Request("http://localhost/api/marketing/publish/content-1", { method: "POST" }),
      { params: Promise.resolve({ id: "content-1" }) }
    )

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: "Instagram publishing is disabled by feature flag." })
    expect(repository.queueStaticRender).not.toHaveBeenCalled()
  })

  it("does not publish failed render content even when publishing is enabled", async () => {
    flags.isInstagramPublishingEnabled.mockReturnValue(true)
    repository.getContentById.mockResolvedValue({ content: { status: "failed" }, assets: [] })

    const response = await publish(
      new Request("http://localhost/api/marketing/publish/content-1", { method: "POST" }),
      { params: Promise.resolve({ id: "content-1" }) }
    )

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: "Only explicitly approved content can be published." })
  })

  it("locks material edits after approval until content is returned to changes", async () => {
    repository.getContentById.mockResolvedValue({ content: { status: "approved" } })

    const response = await edit(new Request("http://localhost/api/marketing/content", {
      method: "PATCH",
      body: JSON.stringify({ id: "content-1", caption: "A changed caption" }),
    }))

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: "Approved, scheduled, and published content is locked. Request changes before editing." })
  })

  it("locks an approved Story before its visual composition can be replaced", async () => {
    const contentId = "1e149a39-7321-42d1-900c-7389c0da37a3"
    const sourceAssetId = "b2041f1f-89e9-4a59-a8de-00169502f523"
    repository.getContentById.mockResolvedValue({ content: { id: contentId, contentType: "story", status: "approved" }, assets: [] })

    const response = await updateStory(new Request(`http://localhost/api/marketing/content/${contentId}/story`, {
      method: "PATCH",
      body: JSON.stringify({ sourceAssetId, storyCopy: { headline: "Villa Verde", supportingLine: "Parra", highlights: [], priceLine: "", cta: "Arrange a viewing" }, layoutStyle: "editorial_panel", logoEnabled: false }),
    }), { params: Promise.resolve({ id: contentId }) })

    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({ error: "Approved, scheduled, and published Stories are locked. Request changes before editing." })
    expect(repository.queueStaticRender).not.toHaveBeenCalled()
  })

  it("recovers a stuck rendering Story through a fresh token without creating another content record", async () => {
    const contentId = "1e149a39-7321-42d1-900c-7389c0da37a3"
    const sourceAssetId = "b2041f1f-89e9-4a59-a8de-00169502f523"
    repository.getContentById.mockResolvedValue({
      content: {
        id: contentId,
        contentType: "story",
        status: "rendering",
        primaryPropertyId: contentId,
        propertySnapshot: { id: contentId },
        composition: {},
      },
      assets: [{ id: sourceAssetId, kind: "original_reference", mediaType: "image", sourceUrl: "https://project.supabase.co/storage/v1/object/sign/villa.jpg" }],
    })
    repository.queueStaticRender.mockResolvedValue({ content: { id: contentId }, job: { id: "new-story-job" } })
    repository.addAuditLog.mockResolvedValue(undefined)

    const response = await updateStory(new Request(`http://localhost/api/marketing/content/${contentId}/story`, {
      method: "PATCH",
      body: JSON.stringify({
        sourceAssetId,
        storyCopy: {
          headline: "Villa Verde in Parra",
          supportingLine: "A considered North Goa address.",
          highlights: [
            "Four bedrooms with a private garden and pool deck",
            "Generous interiors for slow tropical living",
            "A quiet setting close to daily conveniences",
          ],
          priceLine: "",
          cta: "Arrange a private viewing",
        },
        layoutStyle: "editorial_panel",
        logoEnabled: false,
      }),
    }), { params: Promise.resolve({ id: contentId }) })

    expect(response.status).toBe(202)
    expect(repository.queueStaticRender).toHaveBeenCalledWith(expect.objectContaining({
      contentId,
      type: "render_image",
      renderToken: expect.any(String),
      changes: expect.objectContaining({
        composition: expect.objectContaining({ storyCopy: expect.objectContaining({ highlights: expect.any(Array) }) }),
      }),
    }))
    expect(repository.enqueueJob).not.toHaveBeenCalled()
    await expect(response.json()).resolves.toMatchObject({ queued: true, storyCopy: expect.any(Object) })
  })

  it("persists an AI-improved Story creative before queuing its replacement render", async () => {
    const contentId = "1e149a39-7321-42d1-900c-7389c0da37a3"
    const sourceAssetId = "b2041f1f-89e9-4a59-a8de-00169502f523"
    const property = { id: contentId, title: "Villa Verde", amenities: [], features: [], media: [] }
    repository.getContentById.mockResolvedValue({
      content: {
        id: contentId,
        contentType: "story",
        status: "ready_for_review",
        primaryPropertyId: contentId,
        propertySnapshot: property,
        creativeDirection: "luxury_editorial",
        creative: {},
        composition: {
          propertyId: contentId,
          format: "story",
          aspectRatio: "9:16",
          sourceAssetId,
          storyCopy: { headline: "Villa Verde", supportingLine: "Parra", highlights: [], priceLine: "", cta: "Arrange a viewing" },
          layoutStyle: "editorial_panel",
          typographyStyle: "modern_sans",
          renderToken: "0f0f8bbf-943a-4f00-a80e-5b8d9cbb1ef0",
          logo: { enabled: false, placement: "top_right", scale: "small", opacity: 0.8 },
        },
      },
      assets: [{ id: sourceAssetId, kind: "original_reference", mediaType: "image", sourceUrl: "https://project.supabase.co/storage/v1/object/sign/villa.jpg" }],
    })
    repository.getPropertySnapshot.mockResolvedValue(property)
    repository.getBrandSettings.mockResolvedValue({})
    repository.queueStaticRender.mockResolvedValue({ content: { id: contentId }, job: { id: "story-job" } })
    repository.addAuditLog.mockResolvedValue(undefined)
    creativeAi.improveStoryCopy.mockResolvedValue({ headline: "A calmer Villa Verde", supportingLine: "Parra", highlights: ["Four bedrooms"], priceLine: "", cta: "Arrange a viewing" })

    const response = await improveStory(new Request(`http://localhost/api/marketing/content/${contentId}/story`, {
      method: "POST",
      body: JSON.stringify({ prompt: "Make it calmer" }),
    }), { params: Promise.resolve({ id: contentId }) })

    expect(response.status).toBe(202)
    expect(repository.queueStaticRender).toHaveBeenCalledWith(expect.objectContaining({
      contentId,
      changes: expect.objectContaining({
        composition: expect.objectContaining({
          sourceAssetId,
          storyCopy: expect.objectContaining({ headline: "A calmer Villa Verde" }),
          renderToken: expect.any(String),
        }),
      }),
    }))
    await expect(response.json()).resolves.toMatchObject({ queued: true, storyCopy: { headline: "A calmer Villa Verde" } })
  })

  it("queues an approved Reel through the atomic render-job operation", async () => {
    const contentId = "1e149a39-7321-42d1-900c-7389c0da37a3"
    const assetId = "b2041f1f-89e9-4a59-a8de-00169502f523"
    repository.getContentById.mockResolvedValue({
      content: {
        id: contentId,
        contentType: "reel",
        status: "approved",
        composition: {
          propertyId: contentId,
          format: "reel",
          aspectRatio: "9:16",
          duration: 15,
          scenes: [{ assetId, start: 0, duration: 15, crop: "cover", motion: "none", transitionOut: "fade" }],
          caption: "A considered introduction.",
          hashtags: ["#NorthGoa"],
          cta: "Arrange a viewing.",
          coverText: "Villa Verde",
          audio: { type: "none", label: "No audio selected" },
        },
      },
      assets: [{ id: assetId, kind: "original_reference", mediaType: "image", sourceUrl: "https://project.supabase.co/storage/v1/object/sign/villa.jpg" }],
    })
    repository.queueReelRender.mockResolvedValue({ id: "job-1", type: "render_reel", status: "queued" })

    const response = await render(
      new Request(`http://localhost/api/marketing/content/${contentId}/render`, { method: "POST" }),
      { params: Promise.resolve({ id: contentId }) }
    )

    expect(response.status).toBe(202)
    expect(repository.queueReelRender).toHaveBeenCalledWith(expect.objectContaining({
      contentId,
      updatedBy: "admin-1",
      jobInput: { resumeApproved: true },
      idempotencyKey: expect.stringMatching(new RegExp(`^render-reel:${contentId}:`)),
    }))
    expect(repository.addAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: "render.requested" }))
  })
})
