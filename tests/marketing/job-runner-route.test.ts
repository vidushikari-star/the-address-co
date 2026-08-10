import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const worker = vi.hoisted(() => ({ run: vi.fn() }))

vi.mock("@/lib/marketing/services/marketing-worker-service", () => ({
  MarketingWorkerService: worker,
  VERCEL_SAFE_JOB_TYPES: ["analyze_media", "generate_creative", "publish_instagram", "sync_publish_status", "sync_analytics"],
}))

import { POST } from "@/app/api/marketing/jobs/run/route"

const originalSecret = process.env.MARKETING_CRON_SECRET

afterEach(() => {
  if (originalSecret === undefined) delete process.env.MARKETING_CRON_SECRET
  else process.env.MARKETING_CRON_SECRET = originalSecret
  vi.clearAllMocks()
})

beforeEach(() => {
  process.env.MARKETING_CRON_SECRET = "worker-test-secret"
  worker.run.mockResolvedValue([])
})

describe("POST /api/marketing/jobs/run", () => {
  it("requires the protected cron secret", async () => {
    const response = await POST(new Request("http://localhost/api/marketing/jobs/run", { method: "POST" }))

    expect(response.status).toBe(401)
    expect(worker.run).not.toHaveBeenCalled()
  })

  it("processes only API-safe jobs so render jobs stay on Railway", async () => {
    const response = await POST(new Request("http://localhost/api/marketing/jobs/run", {
      method: "POST",
      headers: { Authorization: "Bearer worker-test-secret" },
    }))

    expect(response.status).toBe(200)
    expect(worker.run).toHaveBeenCalledWith(3, {
      jobTypes: ["analyze_media", "generate_creative", "publish_instagram", "sync_publish_status", "sync_analytics"],
    })
  })
})
