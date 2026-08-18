import { beforeEach, describe, expect, it, vi } from "vitest"

const access = vi.hoisted(() => ({ requireMarketingApiAccess: vi.fn() }))
const flags = vi.hoisted(() => ({ isInstagramPublishingEnabled: vi.fn() }))
const repository = vi.hoisted(() => ({ getContentById: vi.fn(), enqueueJob: vi.fn(), queueReelRender: vi.fn(), addAuditLog: vi.fn(), getBrandSettings: vi.fn(), getActiveBrandLogo: vi.fn(), updateContent: vi.fn() }))

vi.mock("@/lib/auth/marketing", () => access)
vi.mock("@/lib/marketing/feature-flags", () => flags)
vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))
vi.mock("@/lib/marketing/services/approval-service", () => ({ ApprovalService: { approve: vi.fn(), requestChanges: vi.fn(), reject: vi.fn() } }))

import { POST as approve } from "@/app/api/marketing/content/[id]/approval/route"
import { PATCH as edit } from "@/app/api/marketing/content/route"
import { POST as publish } from "@/app/api/marketing/publish/[id]/route"
import { POST as render } from "@/app/api/marketing/content/[id]/render/route"
import { PATCH as updateStory } from "@/app/api/marketing/content/[id]/story/route"

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
    expect(repository.enqueueJob).not.toHaveBeenCalled()
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
    expect(repository.enqueueJob).not.toHaveBeenCalled()
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
      assets: [],
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
