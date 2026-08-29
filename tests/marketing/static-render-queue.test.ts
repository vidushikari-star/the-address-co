import { beforeEach, describe, expect, it, vi } from "vitest"

const supabase = vi.hoisted(() => ({ from: vi.fn() }))

vi.mock("@/lib/supabase/server", () => ({ createServerSupabaseClient: async () => supabase }))

import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

const contentId = "1e149a39-7321-42d1-900c-7389c0da37a3"

function contentUpdateQuery(updates: Record<string, unknown>[]) {
  const query = { update: vi.fn(), eq: vi.fn(), select: vi.fn(), single: vi.fn() }
  query.update.mockImplementation((value: Record<string, unknown>) => {
    updates.push(value)
    return query
  })
  query.eq.mockReturnValue(query)
  query.select.mockReturnValue(query)
  query.single.mockResolvedValue({ data: { id: contentId, content_type: "single_image", composition: {}, created_at: "2026-08-18T00:00:00.000Z", updated_at: "2026-08-18T00:00:00.000Z" }, error: null })
  return query
}

describe("static render queue recovery", () => {
  beforeEach(() => vi.clearAllMocks())

  it("marks content failed when queue insertion fails after entering rendering", async () => {
    const updates: Record<string, unknown>[] = []
    const queuedSelect = { select: vi.fn(), eq: vi.fn(), in: vi.fn() }
    queuedSelect.select.mockReturnValue(queuedSelect)
    queuedSelect.eq.mockReturnValue(queuedSelect)
    queuedSelect.in.mockResolvedValue({ data: [], error: null })
    const enqueue = { upsert: vi.fn(), select: vi.fn(), maybeSingle: vi.fn() }
    enqueue.upsert.mockReturnValue(enqueue)
    enqueue.select.mockReturnValue(enqueue)
    enqueue.maybeSingle.mockResolvedValue({ data: null, error: { message: "queue unavailable" } })
    let jobCalls = 0
    supabase.from.mockImplementation((table: string) => {
      if (table === "marketing_content") return contentUpdateQuery(updates)
      if (table === "marketing_jobs") return [queuedSelect, enqueue][jobCalls++]
      throw new Error(`Unexpected table: ${table}`)
    })

    await expect(MarketingRepository.queueStaticRender({
      contentId,
      updatedBy: "admin-1",
      type: "render_image",
      renderToken: "34d1e601-18e9-4caa-9cc4-8af4c11888f1",
    })).rejects.toThrow("Story was marked failed")

    expect(updates[0]).toMatchObject({ status: "rendering", last_error: null, updated_by: "admin-1" })
    expect(updates[1]).toMatchObject({
      status: "failed",
      last_error: "Render could not be queued. Retry the Story creative when the queue is available.",
      updated_by: "admin-1",
    })
  })
})
