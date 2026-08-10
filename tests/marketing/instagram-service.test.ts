import { afterEach, describe, expect, it, vi } from "vitest"

import { InstagramService } from "@/lib/marketing/services/instagram-service"

const originalFetch = global.fetch

afterEach(() => { global.fetch = originalFetch })

describe("InstagramService", () => {
  it("rejects a tampered OAuth state before any token exchange", () => {
    process.env.MARKETING_OAUTH_STATE_SECRET = "a-strong-state-secret-with-at-least-32-chars"
    const state = InstagramService.createOAuthState()
    expect(InstagramService.verifyAuthorizationState(state)).toBeTruthy()
    expect(() => InstagramService.verifyAuthorizationState(`${state}tampered`)).toThrow("Invalid Instagram OAuth state")
  })

  it("uses a bearer token server-side to poll a media container", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status_code: "FINISHED", status: "Finished" }), { status: 200 }))
    global.fetch = fetchMock
    process.env.META_GRAPH_BASE_URL = "https://graph.instagram.com"
    process.env.META_GRAPH_API_VERSION = "v25.0"

    await expect(InstagramService.getContainerStatus("container-1", "server-token")).resolves.toMatchObject({ status_code: "FINISHED" })
    expect(String(fetchMock.mock.calls[0][0])).toContain("container-1")
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toMatchObject({ Authorization: "Bearer server-token" })
  })
})
