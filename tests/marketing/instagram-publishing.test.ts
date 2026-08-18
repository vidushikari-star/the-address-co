import { beforeEach, describe, expect, it, vi } from "vitest"

import type { MarketingJob } from "@/lib/marketing/types"

const admin = vi.hoisted(() => ({ client: { from: vi.fn(), storage: { from: vi.fn() } } }))
const flags = vi.hoisted(() => ({ isInstagramPublishingEnabled: vi.fn() }))

vi.mock("@/lib/supabase/admin", () => ({ createAdminSupabaseClient: () => admin.client }))
vi.mock("@/lib/marketing/feature-flags", () => flags)

import {
  InstagramApiError,
  InstagramContainerPendingError,
  InstagramContainerTerminalError,
  InstagramService,
} from "@/lib/marketing/services/instagram-service"
import { MarketingWorkerService, VERCEL_SAFE_JOB_TYPES } from "@/lib/marketing/services/marketing-worker-service"
import { TokenCryptoService } from "@/lib/marketing/services/token-crypto-service"

const contentId = "1e149a39-7321-42d1-900c-7389c0da37a3"
const renderToken = "b2041f1f-89e9-4a59-a8de-00169502f523"

function query(data: unknown) {
  const value = { select: vi.fn(), eq: vi.fn(), in: vi.fn(), lte: vi.fn(), order: vi.fn(), limit: vi.fn(), maybeSingle: vi.fn() }
  value.select.mockReturnValue(value)
  value.eq.mockReturnValue(value)
  value.in.mockReturnValue(value)
  value.lte.mockReturnValue(value)
  value.order.mockReturnValue(value)
  value.limit.mockReturnValue(value)
  value.maybeSingle.mockResolvedValue({ data, error: null })
  Object.assign(value, { then: (resolve: (result: { data: unknown; error: null }) => unknown) => Promise.resolve({ data, error: null }).then(resolve) })
  return value
}

function updateQuery(error: unknown = null) {
  const value = { update: vi.fn(), eq: vi.fn(), in: vi.fn() }
  value.update.mockReturnValue(value)
  value.eq.mockReturnValue(value)
  value.in.mockReturnValue(value)
  Object.assign(value, { then: (resolve: (result: { error: unknown }) => unknown) => Promise.resolve({ error }).then(resolve) })
  return value
}

function upsertQuery(data: unknown) {
  const value = { upsert: vi.fn(), select: vi.fn(), single: vi.fn() }
  value.upsert.mockReturnValue(value)
  value.select.mockReturnValue(value)
  value.single.mockResolvedValue({ data, error: null })
  return value
}

function insertQuery() {
  return { insert: vi.fn().mockResolvedValue({ error: null }) }
}

function contentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: contentId,
    content_type: "single_image",
    status: "scheduled",
    property_snapshot: {},
    creative_direction: "surprise_me",
    hashtags: ["#NorthGoa"],
    caption: "A considered introduction.",
    creative: {},
    composition: { format: "single_image", renderToken },
    proposed_publish_at: "2026-08-10T00:00:00.000Z",
    created_at: "2026-08-10T00:00:00.000Z",
    updated_at: "2026-08-10T00:00:00.000Z",
    ...overrides,
  }
}

function assetRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "asset-1",
    content_id: contentId,
    kind: "rendered_media",
    media_type: "image",
    storage_path: `${contentId}/rendered/feed.jpg`,
    source_url: null,
    metadata: { instagramFormat: "single_image", renderToken, sourceAssetId: "asset-1", width: 1080, height: 1350, aspectRatio: "4:5" },
    sort_order: 0,
    created_at: "2026-08-10T00:00:00.000Z",
    ...overrides,
  }
}

function runningJob(overrides: Partial<MarketingJob> = {}): MarketingJob {
  return {
    id: "job-1", contentId, type: "publish_instagram", status: "running", progress: 5,
    input: {}, output: {}, attempts: 1, maxAttempts: 10,
    runAfter: "2026-08-10T00:00:00.000Z", createdAt: "2026-08-10T00:00:00.000Z", updatedAt: "2026-08-10T00:00:00.000Z",
    ...overrides,
  }
}

function privateWorker() {
  return MarketingWorkerService as unknown as {
    publishInstagram: (job: MarketingJob) => Promise<Record<string, unknown>>
    process: (job: MarketingJob) => Promise<Record<string, unknown>>
  }
}

function installPublishingAdmin(input: {
  content?: Record<string, unknown>
  assets?: Record<string, unknown>[]
  account?: Record<string, unknown> | null
  publication?: Record<string, unknown> | null
}) {
  const contentSelect = query(input.content ?? contentRow())
  const assetsSelect = query(input.assets ?? [assetRow()])
  const accountSelect = query(input.account === undefined ? {
    id: "account-1", external_account_id: "17841400000000001", access_token_ciphertext: "ciphertext", status: "connected",
  } : input.account)
  const publicationSelect = query(input.publication ?? null)
  const publicationUpsert = upsertQuery(input.publication ?? {
    id: "publication-1", external_container_id: null, publish_attempted_at: null, status: "pending",
  })
  const contentUpdates = [updateQuery(), updateQuery(), updateQuery()]
  const publicationUpdates = [updateQuery(), updateQuery(), updateQuery(), updateQuery()]
  const audit = insertQuery()
  const usage = insertQuery()
  let contentCalls = 0
  let publicationCalls = 0

  admin.client.from.mockImplementation((table: string) => {
    if (table === "marketing_content") return contentCalls++ === 0 ? contentSelect : contentUpdates[contentCalls - 2]
    if (table === "marketing_content_assets") return assetsSelect
    if (table === "marketing_accounts") return accountSelect
    if (table === "marketing_publications") {
      const call = publicationCalls++
      if (call === 0) return publicationSelect
      if (call === 1) return publicationUpsert
      return publicationUpdates[call - 2]
    }
    if (table === "marketing_audit_logs") return audit
    if (table === "marketing_usage_events") return usage
    throw new Error(`Unexpected table: ${table}`)
  })
  return { contentUpdates, publicationUpdates, publicationUpsert }
}

beforeEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  flags.isInstagramPublishingEnabled.mockReturnValue(true)
  vi.spyOn(TokenCryptoService, "decrypt").mockReturnValue("server-token")
  vi.spyOn(InstagramService, "createContainer").mockResolvedValue({ containerId: "container-1", diagnostics: {} })
  vi.spyOn(InstagramService, "getContainerStatus").mockResolvedValue({ status_code: "FINISHED" })
  vi.spyOn(InstagramService, "publishContainer").mockResolvedValue({ publicationId: "ig-media-1", diagnostics: {} })
  vi.spyOn(InstagramService, "getPublicationPermalink").mockResolvedValue("https://www.instagram.com/p/example/")
  admin.client.storage.from.mockReturnValue({ createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://project.supabase.co/signed" }, error: null }) })
})

describe("Instagram publishing worker", () => {
  it("does not call Meta while the publishing kill switch is disabled", async () => {
    flags.isInstagramPublishingEnabled.mockReturnValue(false)

    await expect(privateWorker().publishInstagram(runningJob())).rejects.toThrow("Instagram publishing is disabled")
    expect(InstagramService.createContainer).not.toHaveBeenCalled()
  })

  it("rejects missing connection, unapproved content, and a scheduled item that is not due", async () => {
    installPublishingAdmin({ account: null })
    await expect(privateWorker().publishInstagram(runningJob())).rejects.toThrow("Instagram is not connected")

    installPublishingAdmin({ content: contentRow({ status: "draft" }) })
    await expect(privateWorker().publishInstagram(runningJob())).rejects.toThrow("content is not approved")

    installPublishingAdmin({ content: contentRow({ proposed_publish_at: "2099-08-10T00:00:00.000Z" }) })
    await expect(privateWorker().publishInstagram(runningJob())).rejects.toThrow("not due yet")
  })

  it("publishes a validated rendered Feed image and persists the Meta publication", async () => {
    const db = installPublishingAdmin({})

    await expect(privateWorker().publishInstagram(runningJob())).resolves.toEqual({ publicationId: "ig-media-1", permalink: "https://www.instagram.com/p/example/" })

    expect(InstagramService.createContainer).toHaveBeenCalledWith(expect.objectContaining({
      instagramAccountId: "17841400000000001",
      mediaAssets: [expect.objectContaining({ mediaType: "image", signedUrl: "https://project.supabase.co/signed" })],
    }))
    expect(InstagramService.publishContainer).toHaveBeenCalledWith(expect.objectContaining({ containerId: "container-1" }))
    expect(db.publicationUpdates[2].update).toHaveBeenCalledWith(expect.objectContaining({ status: "published", external_publication_id: "ig-media-1" }))
    expect(db.contentUpdates[1].update).toHaveBeenCalledWith(expect.objectContaining({ status: "published" }))
  })

  it("publishes only a validated rendered MP4 for a Reel through a private signed URL", async () => {
    installPublishingAdmin({
      content: contentRow({ content_type: "reel", composition: { format: "reel" } }),
      assets: [assetRow({ kind: "rendered_media", media_type: "video", storage_path: `${contentId}/rendered/reel.mp4`, source_url: null, metadata: { format: "1080x1920-h264-mp4", width: 1080, height: 1920, aspectRatio: "9:16" } })],
    })

    await privateWorker().publishInstagram(runningJob())

    expect(admin.client.storage.from).toHaveBeenCalledWith("marketing-assets")
    expect(InstagramService.createContainer).toHaveBeenCalledWith(expect.objectContaining({ mediaAssets: [expect.objectContaining({ signedUrl: "https://project.supabase.co/signed" })] }))
  })

  it("fails an invalid scheduled Carousel before it can create any Meta container", async () => {
    installPublishingAdmin({
      content: contentRow({ content_type: "carousel", composition: { format: "carousel", selectedAssetIds: ["asset-image", "asset-video"] } }),
      assets: [
        assetRow({ id: "asset-image", kind: "original_reference", media_type: "image", source_url: "https://crm.example/property.jpg" }),
        assetRow({ id: "asset-video", kind: "original_reference", media_type: "video", source_url: "https://crm.example/tour.mp4", sort_order: 1 }),
      ],
    })

    await expect(privateWorker().publishInstagram(runningJob())).rejects.toThrow("This Carousel contains unsupported video media")
    expect(InstagramService.createContainer).not.toHaveBeenCalled()
    expect(InstagramService.publishContainer).not.toHaveBeenCalled()
  })

  it("keeps a pending Reel container queued without calling media_publish and marks ERROR as terminal", async () => {
    installPublishingAdmin({ content: contentRow({ content_type: "reel", composition: { format: "reel" } }), assets: [assetRow({ kind: "rendered_media", media_type: "video", storage_path: "rendered.mp4", source_url: null, metadata: { format: "1080x1920-h264-mp4", width: 1080, height: 1920, aspectRatio: "9:16" } })] })
    vi.spyOn(InstagramService, "getContainerStatus").mockResolvedValueOnce({ status_code: "IN_PROGRESS" })
    await expect(privateWorker().publishInstagram(runningJob())).rejects.toBeInstanceOf(InstagramContainerPendingError)
    expect(InstagramService.publishContainer).not.toHaveBeenCalled()

    installPublishingAdmin({ content: contentRow({ content_type: "reel", composition: { format: "reel" } }), assets: [assetRow({ kind: "rendered_media", media_type: "video", storage_path: "rendered.mp4", source_url: null, metadata: { format: "1080x1920-h264-mp4", width: 1080, height: 1920, aspectRatio: "9:16" } })] })
    vi.spyOn(InstagramService, "getContainerStatus").mockResolvedValueOnce({ status_code: "ERROR" })
    await expect(privateWorker().publishInstagram(runningJob())).rejects.toBeInstanceOf(InstagramContainerTerminalError)
  })

  it("does not publish a second time after an ambiguous timeout and recovers an already persisted duplicate", async () => {
    installPublishingAdmin({ publication: { id: "publication-1", external_container_id: "container-1", publish_attempted_at: "2026-08-10T00:00:00.000Z", status: "processing" } })
    await expect(privateWorker().publishInstagram(runningJob())).rejects.toThrow("unknown result")
    expect(InstagramService.publishContainer).not.toHaveBeenCalled()

    installPublishingAdmin({ publication: { id: "publication-1", external_publication_id: "ig-media-1", published_at: "2026-08-10T00:00:00.000Z", status: "published" }, content: contentRow({ status: "publishing" }) })
    await expect(privateWorker().publishInstagram(runningJob())).resolves.toMatchObject({ publicationId: "ig-media-1", duplicate: true })
    expect(InstagramService.createContainer).not.toHaveBeenCalled()
  })

  it("turns terminal Meta/auth failures into failed publication, job, and content records", async () => {
    const discovery = query([{
      id: "job-1", content_id: contentId, type: "publish_instagram", status: "queued", progress: 0, input: {}, output: {}, attempts: 0, max_attempts: 10,
      run_after: "2026-08-10T00:00:00.000Z", created_at: "2026-08-10T00:00:00.000Z", updated_at: "2026-08-10T00:00:00.000Z",
    }])
    const locked = query({
      id: "job-1", content_id: contentId, type: "publish_instagram", status: "running", progress: 5, input: {}, output: {}, attempts: 1, max_attempts: 10,
      run_after: "2026-08-10T00:00:00.000Z", created_at: "2026-08-10T00:00:00.000Z", updated_at: "2026-08-10T00:00:00.000Z",
    })
    Object.assign(locked, { update: vi.fn().mockReturnValue(locked) })
    const jobFailure = updateQuery()
    const accountExpired = updateQuery()
    const publicationFailure = updateQuery()
    const contentFailed = updateQuery()
    let jobCalls = 0
    let contentCalls = 0
    admin.client.from.mockImplementation((table: string) => {
      if (table === "marketing_jobs") return [discovery, locked, jobFailure][jobCalls++]
      if (table === "marketing_content") return [contentFailed][contentCalls++]
      if (table === "marketing_accounts") return accountExpired
      if (table === "marketing_publications") return publicationFailure
      throw new Error(`Unexpected table: ${table}`)
    })
    vi.spyOn(privateWorker(), "process").mockRejectedValue(new InstagramApiError("Instagram authentication failed. Reconnect the account.", 401, 190))

    await expect(MarketingWorkerService.run(1, { jobTypes: VERCEL_SAFE_JOB_TYPES })).resolves.toEqual([{ id: "job-1", status: "failed" }])
    expect(jobFailure.update).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }))
    expect(publicationFailure.update).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }))
    expect(contentFailed.update).toHaveBeenCalledWith(expect.objectContaining({ status: "failed" }))
  })
})
