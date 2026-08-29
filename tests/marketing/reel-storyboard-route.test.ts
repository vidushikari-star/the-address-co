import { beforeEach, describe, expect, it, vi } from "vitest"

const access = vi.hoisted(() => ({ requireMarketingApiAccess: vi.fn() }))
const storyboard = vi.hoisted(() => ({ updateStoryboard: vi.fn() }))

vi.mock("@/lib/auth/marketing", () => access)
vi.mock("@/lib/marketing/services/reel-version-service", () => ({ ReelVersionService: storyboard }))

import { PATCH } from "@/app/api/marketing/content/[id]/reel/storyboard/route"

const contentId = "1e149a39-7321-42d1-900c-7389c0da37a3"
const scene = {
  assetId: "b2041f1f-89e9-4a59-a8de-00169502f523",
  start: 0,
  duration: 3,
  crop: "cover",
  motion: "slow_zoom",
  overlay: { text: "Villa Verde", position: "top_left", type: "hook" },
  transitionOut: "fade",
}

beforeEach(() => {
  vi.clearAllMocks()
  access.requireMarketingApiAccess.mockResolvedValue({ user: { id: "admin-1" }, error: null, status: null })
  storyboard.updateStoryboard.mockResolvedValue({ content: { id: contentId }, version: { id: "version-1", versionNumber: 2 }, createdDraft: true })
})

describe("M3 Reel storyboard route", () => {
  it("persists the user scene sequence through the editable Reel-version service", async () => {
    const response = await PATCH(new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ scenes: [scene] }),
      headers: { "Content-Type": "application/json" },
    }), { params: Promise.resolve({ id: contentId }) })

    expect(response.status).toBe(200)
    expect(storyboard.updateStoryboard).toHaveBeenCalledWith({ contentId, scenes: [scene], adminId: "admin-1" })
  })

  it("rejects duplicate property scenes before a version can be changed", async () => {
    const response = await PATCH(new Request("http://localhost", {
      method: "PATCH",
      body: JSON.stringify({ scenes: [scene, { ...scene, start: 3 }] }),
      headers: { "Content-Type": "application/json" },
    }), { params: Promise.resolve({ id: contentId }) })

    expect(response.status).toBe(400)
    expect(storyboard.updateStoryboard).not.toHaveBeenCalled()
  })
})
