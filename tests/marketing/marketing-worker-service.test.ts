import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { MarketingJob } from "@/lib/marketing/types"
import { RenderStageError } from "@/lib/marketing/render-diagnostics"

const admin = vi.hoisted(() => ({ client: { from: vi.fn(), rpc: vi.fn(), storage: { from: vi.fn() } } }))
const renderService = vi.hoisted(() => ({ renderReel: vi.fn() }))

vi.mock("@/lib/supabase/admin", () => ({ createAdminSupabaseClient: () => admin.client }))
vi.mock("@/lib/marketing/services/render-service", () => ({ RenderService: renderService }))

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
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("MarketingWorkerService render queue", () => {
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
    vi.spyOn(privateWorker(), "process").mockRejectedValue(new RenderStageError("ffmpeg", "FFmpeg was terminated by SIGKILL"))
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
      error: "Render ffmpeg failed: FFmpeg was terminated by SIGKILL",
    }))
    expect(contentFailure.update).toHaveBeenCalledWith({
      status: "failed",
      last_error: "Render ffmpeg failed: FFmpeg was terminated by SIGKILL",
    })
  })
})
