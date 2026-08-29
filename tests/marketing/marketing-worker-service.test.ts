import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { MarketingJob } from "@/lib/marketing/types"
import { RenderStageError } from "@/lib/marketing/render-diagnostics"

const admin = vi.hoisted(() => ({ client: { from: vi.fn(), rpc: vi.fn(), storage: { from: vi.fn() } } }))
const renderService = vi.hoisted(() => ({
  renderReel: vi.fn(),
  renderImage: vi.fn(),
  renderStory: vi.fn(),
  RenderDeferredError: class RenderDeferredError extends Error {},
}))
const brandAssets = vi.hoisted(() => ({ resolveLogo: vi.fn() }))

vi.mock("@/lib/supabase/admin", () => ({ createAdminSupabaseClient: () => admin.client }))
vi.mock("@/lib/marketing/services/render-service", () => ({
  RenderService: renderService,
  RenderDeferredError: renderService.RenderDeferredError,
}))
vi.mock("@/lib/marketing/services/brand-asset-service", () => ({ BrandAssetService: brandAssets }))

import { MarketingWorkerService, RENDER_JOB_TYPES } from "@/lib/marketing/services/marketing-worker-service"

const contentId = "1e149a39-7321-42d1-900c-7389c0da37a3"
const assetId = "b2041f1f-89e9-4a59-a8de-00169502f523"

function queuedJob(overrides: Record<string, unknown> = {}) {
  return {
    id: "job-1",
    content_id: contentId,
    type: "render_reel",
    status: "queued",
    progress: 0,
    input: { resumeApproved: true },
    output: {},
    error: null,
    attempts: 0,
    max_attempts: 3,
    run_after: "2026-08-10T00:00:00.000Z",
    created_at: "2026-08-10T00:00:00.000Z",
    updated_at: "2026-08-10T00:00:00.000Z",
    ...overrides,
  }
}

function reelComposition() {
  return {
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
  }
}

function queryWithRows(rows: unknown[]) {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    lte: vi.fn(),
    order: vi.fn(),
    limit: vi.fn(),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.in.mockReturnValue(query)
  query.lte.mockReturnValue(query)
  query.order.mockReturnValue(query)
  query.limit.mockResolvedValue({ data: rows, error: null })
  return query
}

function lockQuery(row: Record<string, unknown>) {
  const query = {
    update: vi.fn(),
    eq: vi.fn(),
    select: vi.fn(),
    maybeSingle: vi.fn(),
  }
  query.update.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.select.mockReturnValue(query)
  query.maybeSingle.mockResolvedValue({ data: row, error: null })
  return query
}

function terminalUpdateQuery() {
  const query = { update: vi.fn(), eq: vi.fn() }
  query.update.mockReturnValue(query)
  query.eq.mockResolvedValue({ error: null })
  return query
}

function privateWorker() {
  return MarketingWorkerService as unknown as {
    process: (job: MarketingJob) => Promise<Record<string, unknown>>
    renderReel: (job: MarketingJob) => Promise<Record<string, unknown>>
    renderImages: (job: MarketingJob, carousel: boolean) => Promise<Record<string, unknown>>
  }
}

function selectOne(row: Record<string, unknown>) {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.maybeSingle.mockResolvedValue({ data: row, error: null })
  return query
}

function selectAssets(rows: Record<string, unknown>[]) {
  const query = { select: vi.fn(), eq: vi.fn(), order: vi.fn() }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.order.mockResolvedValue({ data: rows, error: null })
  return query
}

function staticContentRow(contentType: "single_image" | "carousel") {
  return {
    id: contentId,
    content_type: contentType,
    status: "rendering",
    property_snapshot: { id: contentId },
    creative_direction: "luxury_editorial",
    hashtags: ["#NorthGoa"],
    headline: "Villa Verde",
    creative: { coverText: "Never paint this onto the image", carouselSlides: ["Neither this", "nor this"] },
    composition: {
      format: contentType,
      renderToken: "render-token",
      selectedAssetIds: contentType === "carousel" ? ["cover", "detail"] : ["cover"],
    },
    created_at: "2026-08-10T00:00:00.000Z",
    updated_at: "2026-08-10T00:00:00.000Z",
  }
}

function staticAssets() {
  return [
    { id: "cover", content_id: contentId, kind: "original_reference", media_type: "image", source_url: "https://project.supabase.co/storage/cover.jpg", metadata: { isCover: true }, sort_order: 0, created_at: "2026-08-10T00:00:00.000Z" },
    { id: "detail", content_id: contentId, kind: "original_reference", media_type: "image", source_url: "https://project.supabase.co/storage/detail.jpg", metadata: {}, sort_order: 1, created_at: "2026-08-10T00:00:00.000Z" },
  ]
}

function configureStaticRender(contentType: "single_image" | "carousel") {
  const contentSelect = selectOne(staticContentRow(contentType))
  const assetsSelect = selectAssets(staticAssets())
  const assetInsert = { insert: vi.fn().mockResolvedValue({ error: null }) }
  const contentUpdate = terminalUpdateQuery()
  const auditInsert = { insert: vi.fn().mockResolvedValue({ error: null }) }
  let contentCalls = 0
  let assetCalls = 0
  admin.client.from.mockImplementation((table: string) => {
    if (table === "marketing_content") return [contentSelect, contentUpdate][contentCalls++]
    if (table === "marketing_content_assets") return [assetsSelect, assetInsert][assetCalls++]
    if (table === "marketing_audit_logs") return auditInsert
    throw new Error(`Unexpected table: ${table}`)
  })
  return { assetInsert, contentUpdate }
}

function configureStoryRender(logoEnabled: boolean) {
  const storyAssetId = "34d1e601-18e9-4caa-9cc4-8af4c11888f1"
  const contentSelect = selectOne({
    id: contentId,
    content_type: "story",
    status: "rendering",
    property_snapshot: { id: contentId },
    creative_direction: "luxury_editorial",
    hashtags: [],
    creative: {},
    composition: {
      propertyId: contentId,
      format: "story",
      aspectRatio: "9:16",
      sourceAssetId: storyAssetId,
      storyCopy: { headline: "Villa Verde", supportingLine: "Parra", highlights: [], priceLine: "", cta: "Arrange a viewing" },
      layoutStyle: "editorial_panel",
      typographyStyle: "modern_sans",
      renderToken: "0f0f8bbf-943a-4f00-a80e-5b8d9cbb1ef0",
      logo: { enabled: logoEnabled, placement: "top_right", scale: "small", opacity: 0.8, assetId: "8ae7a13d-bcaa-4b58-9355-c3d161f8ae42" },
    },
    created_at: "2026-08-10T00:00:00.000Z",
    updated_at: "2026-08-10T00:00:00.000Z",
  })
  const assetsSelect = selectAssets([{
    id: storyAssetId, content_id: contentId, kind: "original_reference", media_type: "image",
    source_url: "https://project.supabase.co/storage/story-source.jpg", metadata: {}, sort_order: 0,
    created_at: "2026-08-10T00:00:00.000Z",
  }])
  const assetInsert = { insert: vi.fn().mockResolvedValue({ error: null }) }
  const contentUpdate = terminalUpdateQuery()
  const auditInsert = { insert: vi.fn().mockResolvedValue({ error: null }) }
  let contentCalls = 0
  let assetCalls = 0
  admin.client.from.mockImplementation((table: string) => {
    if (table === "marketing_content") return [contentSelect, contentUpdate][contentCalls++]
    if (table === "marketing_content_assets") return [assetsSelect, assetInsert][assetCalls++]
    if (table === "marketing_audit_logs") return auditInsert
    throw new Error(`Unexpected table: ${table}`)
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("MarketingWorkerService render queue", () => {
  it("repairs expired job leases before looking for new work", async () => {
    const discovery = queryWithRows([])
    admin.client.from.mockReturnValue(discovery)
    admin.client.rpc.mockResolvedValue({
      data: [{ requeued_count: 2, failed_publish_count: 1 }],
      error: null,
    })

    await expect(MarketingWorkerService.run(1, { jobTypes: RENDER_JOB_TYPES })).resolves.toEqual([])

    expect(admin.client.rpc).toHaveBeenCalledWith("recover_stale_marketing_jobs", {})
  })

  it("does not silently complete an unsupported queued job type", async () => {
    await expect(privateWorker().process({
      id: "job-unsupported",
      contentId,
      type: "analyze_media",
      status: "running",
      progress: 5,
      input: {},
      output: {},
      attempts: 1,
      maxAttempts: 3,
      runAfter: "2026-08-10T00:00:00.000Z",
      createdAt: "2026-08-10T00:00:00.000Z",
      updatedAt: "2026-08-10T00:00:00.000Z",
    })).rejects.toThrow("Unsupported marketing job type: analyze_media")
  })

  it("discovers and claims queued render_reel jobs for Railway", async () => {
    const candidate = queuedJob()
    const discovery = queryWithRows([candidate])
    const lock = lockQuery(queuedJob({ status: "running", attempts: 1, progress: 5 }))
    const complete = terminalUpdateQuery()
    const process = vi.spyOn(privateWorker(), "process").mockResolvedValue({ rendered: true })
    let jobTableCalls = 0
    admin.client.from.mockImplementation((table: string) => {
      if (table !== "marketing_jobs") throw new Error(`Unexpected table: ${table}`)
      jobTableCalls += 1
      return [discovery, lock, complete][jobTableCalls - 1]
    })

    await expect(MarketingWorkerService.run(1, {
      jobTypes: RENDER_JOB_TYPES,
      diagnosticsLabel: "Railway render",
    })).resolves.toEqual([{ id: "job-1", status: "completed" }])

    expect(discovery.in).toHaveBeenCalledWith("type", ["render_image", "render_carousel", "render_reel"])
    expect(lock.update).toHaveBeenCalledWith(expect.objectContaining({ status: "running", attempts: 1 }))
    expect(process).toHaveBeenCalledWith(expect.objectContaining({ type: "render_reel", status: "running" }))
    expect(complete.update).toHaveBeenCalledWith(expect.objectContaining({ status: "completed", progress: 100 }))
  })

  it("returns a successfully rendered approved Reel to approved status", async () => {
    const contentRow = {
      id: contentId,
      content_type: "reel",
      status: "rendering",
      property_snapshot: { id: contentId },
      creative_direction: "surprise_me",
      hashtags: [],
      creative: {},
      composition: reelComposition(),
      created_at: "2026-08-10T00:00:00.000Z",
      updated_at: "2026-08-10T00:00:00.000Z",
    }
    const contentSelect = {
      select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn(),
    }
    contentSelect.select.mockReturnValue(contentSelect)
    contentSelect.eq.mockReturnValue(contentSelect)
    contentSelect.maybeSingle.mockResolvedValue({ data: contentRow, error: null })
    const assetsSelect = {
      select: vi.fn(), eq: vi.fn(), order: vi.fn(),
    }
    assetsSelect.select.mockReturnValue(assetsSelect)
    assetsSelect.eq.mockReturnValue(assetsSelect)
    assetsSelect.order.mockResolvedValue({ data: [{
      id: assetId,
      content_id: contentId,
      kind: "original_reference",
      media_type: "image",
      source_url: "https://example.com/villa.jpg",
      metadata: {}, sort_order: 0, created_at: "2026-08-10T00:00:00.000Z",
    }], error: null })
    const assetInsert = { insert: vi.fn().mockResolvedValue({ error: null }) }
    const contentUpdate = terminalUpdateQuery()
    const auditInsert = { insert: vi.fn() }
    const usageInsert = { insert: vi.fn() }
    let contentCalls = 0
    let assetCalls = 0
    admin.client.from.mockImplementation((table: string) => {
      if (table === "marketing_content") return [contentSelect, contentUpdate][contentCalls++]
      if (table === "marketing_content_assets") return [assetsSelect, assetInsert][assetCalls++]
      if (table === "marketing_audit_logs") return auditInsert
      if (table === "marketing_usage_events") return usageInsert
      throw new Error(`Unexpected table: ${table}`)
    })
    renderService.renderReel.mockResolvedValue({ storagePath: `${contentId}/rendered/reel.mp4`, duration: 15, byteLength: 1234 })

    await privateWorker().renderReel({
      id: "job-1",
      contentId,
      type: "render_reel",
      status: "running",
      progress: 5,
      input: { resumeApproved: true },
      output: {},
      attempts: 1,
      maxAttempts: 3,
      runAfter: "2026-08-10T00:00:00.000Z",
      createdAt: "2026-08-10T00:00:00.000Z",
      updatedAt: "2026-08-10T00:00:00.000Z",
    })

    expect(renderService.renderReel).toHaveBeenCalledOnce()
    expect(renderService.renderReel).toHaveBeenCalledWith(expect.objectContaining({ audio: null }))
    expect(contentUpdate.update).toHaveBeenCalledWith({ status: "approved", last_error: null })
  })

  it("moves a main Create Studio Reel render into review before approval", async () => {
    const contentSelect = selectOne({
      id: contentId,
      content_type: "reel",
      status: "rendering",
      property_snapshot: { id: contentId },
      creative_direction: "luxury_editorial",
      hashtags: ["#NorthGoa"],
      creative: {},
      composition: reelComposition(),
      created_at: "2026-08-10T00:00:00.000Z",
      updated_at: "2026-08-10T00:00:00.000Z",
    })
    const assetsSelect = selectAssets([{
      id: assetId, content_id: contentId, kind: "original_reference", media_type: "image",
      source_url: "https://project.supabase.co/storage/v1/object/sign/villa.jpg", metadata: {}, sort_order: 0,
      created_at: "2026-08-10T00:00:00.000Z",
    }])
    const assetInsert = { insert: vi.fn().mockResolvedValue({ error: null }) }
    const contentUpdate = terminalUpdateQuery()
    const auditInsert = { insert: vi.fn().mockResolvedValue({ error: null }) }
    const usageInsert = { insert: vi.fn().mockResolvedValue({ error: null }) }
    let contentCalls = 0
    let assetCalls = 0
    admin.client.from.mockImplementation((table: string) => {
      if (table === "marketing_content") return [contentSelect, contentUpdate][contentCalls++]
      if (table === "marketing_content_assets") return [assetsSelect, assetInsert][assetCalls++]
      if (table === "marketing_audit_logs") return auditInsert
      if (table === "marketing_usage_events") return usageInsert
      throw new Error(`Unexpected table: ${table}`)
    })
    renderService.renderReel.mockResolvedValue({ storagePath: `${contentId}/rendered/reel.mp4`, duration: 15, byteLength: 1_234 })

    await privateWorker().renderReel({
      id: "create-studio-reel-job", contentId, type: "render_reel", status: "running", progress: 5,
      input: {}, output: {}, attempts: 1, maxAttempts: 3,
      runAfter: "2026-08-10T00:00:00.000Z", createdAt: "2026-08-10T00:00:00.000Z", updatedAt: "2026-08-10T00:00:00.000Z",
    })

    expect(contentUpdate.update).toHaveBeenCalledWith({ status: "ready_for_review", last_error: null })
  })

  it("resolves a selected private audio track and passes it to the Reel renderer", async () => {
    const contentRow = {
      id: contentId,
      content_type: "reel",
      status: "rendering",
      property_snapshot: { id: contentId },
      creative_direction: "surprise_me",
      hashtags: [],
      creative: {},
      composition: { ...reelComposition(), audio: { type: "uploaded", id: assetId, label: "Licensed piano", durationSeconds: 30 } },
      created_at: "2026-08-10T00:00:00.000Z",
      updated_at: "2026-08-10T00:00:00.000Z",
    }
    const contentSelect = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() }
    contentSelect.select.mockReturnValue(contentSelect)
    contentSelect.eq.mockReturnValue(contentSelect)
    contentSelect.maybeSingle.mockResolvedValue({ data: contentRow, error: null })
    const assetsSelect = { select: vi.fn(), eq: vi.fn(), order: vi.fn() }
    assetsSelect.select.mockReturnValue(assetsSelect)
    assetsSelect.eq.mockReturnValue(assetsSelect)
    assetsSelect.order.mockResolvedValue({ data: [{ id: assetId, content_id: contentId, kind: "original_reference", media_type: "image", source_url: "https://example.com/villa.jpg", metadata: {}, sort_order: 0, created_at: "2026-08-10T00:00:00.000Z" }], error: null })
    const audioSelect = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() }
    audioSelect.select.mockReturnValue(audioSelect)
    audioSelect.eq.mockReturnValue(audioSelect)
    audioSelect.maybeSingle.mockResolvedValue({ data: { storage_path: "admin/licensed-piano.m4a", mime_type: "audio/mp4", duration_seconds: 30 }, error: null })
    const assetInsert = { insert: vi.fn().mockResolvedValue({ error: null }) }
    const contentUpdate = terminalUpdateQuery()
    const auditInsert = { insert: vi.fn() }
    const usageInsert = { insert: vi.fn() }
    const signed = { createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://project.supabase.co/storage/audio" }, error: null }) }
    admin.client.storage.from.mockReturnValue(signed)
    let contentCalls = 0
    let assetCalls = 0
    admin.client.from.mockImplementation((table: string) => {
      if (table === "marketing_content") return [contentSelect, contentUpdate][contentCalls++]
      if (table === "marketing_content_assets") return [assetsSelect, assetInsert][assetCalls++]
      if (table === "marketing_audio_tracks") return audioSelect
      if (table === "marketing_audit_logs") return auditInsert
      if (table === "marketing_usage_events") return usageInsert
      throw new Error(`Unexpected table: ${table}`)
    })
    renderService.renderReel.mockResolvedValue({ storagePath: `${contentId}/rendered/reel.mp4`, duration: 15, byteLength: 1234 })

    await privateWorker().renderReel({
      id: "job-1", contentId, type: "render_reel", status: "running", progress: 5,
      input: { resumeApproved: true }, output: {}, attempts: 1, maxAttempts: 3,
      runAfter: "2026-08-10T00:00:00.000Z", createdAt: "2026-08-10T00:00:00.000Z", updatedAt: "2026-08-10T00:00:00.000Z",
    })

    expect(signed.createSignedUrl).toHaveBeenCalledWith("admin/licensed-piano.m4a", 60 * 60)
    expect(renderService.renderReel).toHaveBeenCalledWith(expect.objectContaining({
      audio: { sourceUrl: "https://project.supabase.co/storage/audio", mimeType: "audio/mp4", durationSeconds: 30 },
    }))
  })

  it("marks a SIGKILL FFmpeg termination failed without retrying and records it on the content", async () => {
    const candidate = queuedJob()
    const discovery = queryWithRows([candidate])
    const lock = lockQuery(queuedJob({ status: "running", attempts: 1, progress: 5 }))
    const jobFailure = terminalUpdateQuery()
    const contentFailure = terminalUpdateQuery()
    vi.spyOn(privateWorker(), "process").mockRejectedValue(new RenderStageError("ffmpeg", "FFmpeg process was terminated externally by SIGKILL after 12.4 seconds. Resource cause could not be confirmed.", {
      exit_code: null,
      signal: "SIGKILL",
      elapsed_ms: 12_400,
      timed_out: false,
      application_termination: false,
      worker_shutting_down: false,
      job_cancelled: false,
    }))
    let jobTableCalls = 0
    admin.client.from.mockImplementation((table: string) => {
      if (table === "marketing_jobs") return [discovery, lock, jobFailure][jobTableCalls++]
      if (table === "marketing_content") return contentFailure
      throw new Error(`Unexpected table: ${table}`)
    })

    await expect(MarketingWorkerService.run(1, { jobTypes: RENDER_JOB_TYPES }))
      .resolves.toEqual([{ id: "job-1", status: "failed" }])

    expect(jobFailure.update).toHaveBeenCalledWith(expect.objectContaining({
      status: "failed",
      error: "Render ffmpeg failed: FFmpeg process was terminated externally by SIGKILL after 12.4 seconds. Resource cause could not be confirmed.",
      output: expect.objectContaining({ render_diagnostics: expect.objectContaining({ signal: "SIGKILL", application_termination: false }) }),
    }))
    expect(contentFailure.update).toHaveBeenCalledWith({
      status: "failed",
      last_error: "Render ffmpeg failed: FFmpeg process was terminated externally by SIGKILL after 12.4 seconds. Resource cause could not be confirmed.",
    })
  })

  it("cancels an obsolete static-render failure without changing the newer Story status", async () => {
    const candidate = queuedJob({ type: "render_image", input: { renderToken: "old-token" } })
    const discovery = queryWithRows([candidate])
    const lock = lockQuery(queuedJob({ type: "render_image", status: "running", attempts: 1, progress: 5, input: { renderToken: "old-token" } }))
    const currentContent = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() }
    currentContent.select.mockReturnValue(currentContent)
    currentContent.eq.mockReturnValue(currentContent)
    currentContent.maybeSingle.mockResolvedValue({ data: { composition: { renderToken: "new-token" } }, error: null })
    const cancelled = terminalUpdateQuery()
    vi.spyOn(privateWorker(), "process").mockRejectedValue(new Error("This static render is stale."))
    let jobTableCalls = 0
    admin.client.from.mockImplementation((table: string) => {
      if (table === "marketing_jobs") return [discovery, lock, cancelled][jobTableCalls++]
      if (table === "marketing_content") return currentContent
      throw new Error(`Unexpected table: ${table}`)
    })

    await expect(MarketingWorkerService.run(1, { jobTypes: RENDER_JOB_TYPES }))
      .resolves.toEqual([{ id: "job-1", status: "skipped" }])

    expect(cancelled.update).toHaveBeenCalledWith(expect.objectContaining({
      status: "cancelled",
      error: "Superseded by a newer static render request.",
    }))
  })

  it("sends a Feed property image to the clean static renderer without generated copy", async () => {
    configureStaticRender("single_image")
    renderService.renderImage.mockResolvedValue({ storagePath: `${contentId}/rendered/feed.jpg`, byteLength: 2_048 })

    await privateWorker().renderImages({
      id: "feed-job", contentId, type: "render_image", status: "running", progress: 5,
      input: { renderToken: "render-token" }, output: {}, attempts: 1, maxAttempts: 3,
      runAfter: "2026-08-10T00:00:00.000Z", createdAt: "2026-08-10T00:00:00.000Z", updatedAt: "2026-08-10T00:00:00.000Z",
    }, false)

    expect(renderService.renderImage).toHaveBeenCalledWith(expect.objectContaining({
      asset: expect.objectContaining({ id: "cover" }),
      aspectRatio: "4:5",
    }))
    expect(renderService.renderImage.mock.calls[0]?.[0]).not.toHaveProperty("overlayText")
  })

  it("keeps Carousel cover/order while withholding generated slide copy from every render", async () => {
    configureStaticRender("carousel")
    renderService.renderImage
      .mockResolvedValueOnce({ storagePath: `${contentId}/rendered/cover.jpg`, byteLength: 2_048 })
      .mockResolvedValueOnce({ storagePath: `${contentId}/rendered/detail.jpg`, byteLength: 2_048 })

    await privateWorker().renderImages({
      id: "carousel-job", contentId, type: "render_carousel", status: "running", progress: 5,
      input: { renderToken: "render-token" }, output: {}, attempts: 1, maxAttempts: 3,
      runAfter: "2026-08-10T00:00:00.000Z", createdAt: "2026-08-10T00:00:00.000Z", updatedAt: "2026-08-10T00:00:00.000Z",
    }, true)

    expect(renderService.renderImage.mock.calls.map(([input]) => input.asset.id)).toEqual(["cover", "detail"])
    expect(renderService.renderImage.mock.calls.every(([input]) => !("overlayText" in input))).toBe(true)
  })

  it("passes the selected private brand logo to Story rendering through the shared resolver", async () => {
    configureStoryRender(true)
    brandAssets.resolveLogo.mockResolvedValue({
      id: "8ae7a13d-bcaa-4b58-9355-c3d161f8ae42",
      mimeType: "image/png",
      signedUrl: "https://project.supabase.co/storage/v1/object/sign/brand-logo",
    })
    renderService.renderStory.mockResolvedValue({ storagePath: `${contentId}/rendered/story.jpg`, byteLength: 2_048, width: 1080, height: 1920, aspectRatio: "9:16" })

    await privateWorker().renderImages({
      id: "story-job", contentId, type: "render_image", status: "running", progress: 5,
      input: { renderToken: "0f0f8bbf-943a-4f00-a80e-5b8d9cbb1ef0" }, output: {}, attempts: 1, maxAttempts: 3,
      runAfter: "2026-08-10T00:00:00.000Z", createdAt: "2026-08-10T00:00:00.000Z", updatedAt: "2026-08-10T00:00:00.000Z",
    }, false)

    expect(brandAssets.resolveLogo).toHaveBeenCalledWith({
      assetId: "8ae7a13d-bcaa-4b58-9355-c3d161f8ae42",
      activeOnly: true,
      required: true,
    })
    expect(renderService.renderStory).toHaveBeenCalledWith(expect.objectContaining({
      logo: { sourceUrl: "https://project.supabase.co/storage/v1/object/sign/brand-logo", mimeType: "image/png" },
    }))
  })

  it("does not resolve a logo when Story branding is disabled", async () => {
    configureStoryRender(false)
    renderService.renderStory.mockResolvedValue({ storagePath: `${contentId}/rendered/story.jpg`, byteLength: 2_048, width: 1080, height: 1920, aspectRatio: "9:16" })

    await privateWorker().renderImages({
      id: "story-job", contentId, type: "render_image", status: "running", progress: 5,
      input: { renderToken: "0f0f8bbf-943a-4f00-a80e-5b8d9cbb1ef0" }, output: {}, attempts: 1, maxAttempts: 3,
      runAfter: "2026-08-10T00:00:00.000Z", createdAt: "2026-08-10T00:00:00.000Z", updatedAt: "2026-08-10T00:00:00.000Z",
    }, false)

    expect(brandAssets.resolveLogo).not.toHaveBeenCalled()
    expect(renderService.renderStory).toHaveBeenCalledWith(expect.objectContaining({ logo: null }))
  })

  it("surfaces a missing selected Story logo as an actionable render failure", async () => {
    configureStoryRender(true)
    brandAssets.resolveLogo.mockRejectedValue(new Error("The selected brand logo is unavailable. Choose an active logo or disable the logo and render again."))

    await expect(privateWorker().renderImages({
      id: "story-job", contentId, type: "render_image", status: "running", progress: 5,
      input: { renderToken: "0f0f8bbf-943a-4f00-a80e-5b8d9cbb1ef0" }, output: {}, attempts: 1, maxAttempts: 3,
      runAfter: "2026-08-10T00:00:00.000Z", createdAt: "2026-08-10T00:00:00.000Z", updatedAt: "2026-08-10T00:00:00.000Z",
    }, false)).rejects.toThrow("The selected brand logo is unavailable. Choose an active logo or disable the logo and render again.")
    expect(renderService.renderStory).not.toHaveBeenCalled()
  })

  it("defers a render when the worker memory guard is below its safe threshold without failing the Reel", async () => {
    const candidate = queuedJob()
    const discovery = queryWithRows([candidate])
    const lock = lockQuery(queuedJob({ status: "running", attempts: 1, progress: 5 }))
    const jobDeferred = terminalUpdateQuery()
    const contentDeferred = terminalUpdateQuery()
    vi.spyOn(privateWorker(), "process").mockRejectedValue(new renderService.RenderDeferredError("Render deferred: insufficient worker memory."))
    let jobTableCalls = 0
    admin.client.from.mockImplementation((table: string) => {
      if (table === "marketing_jobs") return [discovery, lock, jobDeferred][jobTableCalls++]
      if (table === "marketing_content") return contentDeferred
      throw new Error(`Unexpected table: ${table}`)
    })

    await expect(MarketingWorkerService.run(1, { jobTypes: RENDER_JOB_TYPES }))
      .resolves.toEqual([{ id: "job-1", status: "skipped" }])

    expect(jobDeferred.update).toHaveBeenCalledWith(expect.objectContaining({
      status: "queued",
      error: "Reel render deferred for worker capacity (attempt 1 of 3).",
      progress: 0,
    }))
    expect(contentDeferred.update).toHaveBeenCalledWith({ last_error: "Reel render deferred for worker capacity (attempt 1 of 3)." })
  })

  it("stops a deferred Reel at its attempt ceiling with actionable resource diagnostics", async () => {
    const candidate = queuedJob({ attempts: 2, max_attempts: 3 })
    const discovery = queryWithRows([candidate])
    const lock = lockQuery(queuedJob({ status: "running", attempts: 3, max_attempts: 3, progress: 5 }))
    const jobFailure = terminalUpdateQuery()
    const contentFailure = terminalUpdateQuery()
    vi.spyOn(privateWorker(), "process").mockRejectedValue(new renderService.RenderDeferredError("Render deferred: insufficient worker memory."))
    let jobTableCalls = 0
    admin.client.from.mockImplementation((table: string) => {
      if (table === "marketing_jobs") return [discovery, lock, jobFailure][jobTableCalls++]
      if (table === "marketing_content") return contentFailure
      throw new Error(`Unexpected table: ${table}`)
    })

    await expect(MarketingWorkerService.run(1, { jobTypes: RENDER_JOB_TYPES }))
      .resolves.toEqual([{ id: "job-1", status: "failed" }])

    const terminalMessage = "Reel render stopped after 3 worker-capacity attempts. Retry rendering when worker capacity is available."
    expect(jobFailure.update).toHaveBeenCalledWith(expect.objectContaining({
      status: "failed",
      error: terminalMessage,
      progress: 100,
      output: expect.objectContaining({
        render_diagnostics: expect.objectContaining({
          failure_category: "resource_deferred",
          attempts: 3,
          max_attempts: 3,
          last_failure: "Render deferred: insufficient worker memory.",
        }),
      }),
    }))
    expect(contentFailure.update).toHaveBeenCalledWith({ status: "failed", last_error: terminalMessage })
  })
})
