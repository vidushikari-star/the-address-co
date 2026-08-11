import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const access = vi.hoisted(() => ({ requireMarketingApiAccess: vi.fn() }))
const repository = vi.hoisted(() => ({ createOAuthState: vi.fn() }))
const instagram = vi.hoisted(() => ({ createOAuthState: vi.fn(), hashOAuthState: vi.fn(), createAuthorizationUrl: vi.fn() }))

vi.mock("@/lib/auth/marketing", () => access)
vi.mock("@/lib/marketing/repositories/marketing-repository", () => ({ MarketingRepository: repository }))
vi.mock("@/lib/marketing/services/instagram-service", () => ({ InstagramService: instagram }))

import { GET } from "@/app/api/marketing/instagram/connect/route"
import { InstagramConnectLink } from "@/components/marketing/instagram-connect-link"

beforeEach(() => {
  vi.clearAllMocks()
  access.requireMarketingApiAccess.mockResolvedValue({ user: { id: "admin-1" }, error: null, status: null })
  instagram.createOAuthState.mockReturnValue("state-value")
  instagram.hashOAuthState.mockReturnValue("state-hash")
  instagram.createAuthorizationUrl.mockReturnValue("https://www.instagram.com/oauth/authorize?state=state-value")
  repository.createOAuthState.mockResolvedValue(undefined)
})

describe("Instagram OAuth navigation", () => {
  it("renders a normal document-navigation anchor instead of a fetch control", () => {
    const markup = renderToStaticMarkup(createElement(InstagramConnectLink, { connected: false }))
    expect(markup).toContain('href="/api/marketing/instagram/connect?returnTo=/marketing/settings"')
    expect(markup).toContain("Connect Instagram")
    expect(markup).not.toContain("fetch")
  })

  it("creates protected state then uses a 303 top-level authorization redirect", async () => {
    const response = await GET(new Request("https://crm.example/api/marketing/instagram/connect?returnTo=/marketing/settings"))
    expect(response.status).toBe(303)
    expect(response.headers.get("location")).toBe("https://www.instagram.com/oauth/authorize?state=state-value")
    expect(repository.createOAuthState).toHaveBeenCalledWith(expect.objectContaining({ userId: "admin-1", stateHash: "state-hash", returnTo: "/marketing/settings" }))
  })

  it("does not start OAuth on a settings-related request; only the connect endpoint creates state", async () => {
    expect(repository.createOAuthState).not.toHaveBeenCalled()
  })

  it("rejects unauthenticated connect requests without redirecting to Instagram", async () => {
    access.requireMarketingApiAccess.mockResolvedValue({ user: null, error: "Forbidden", status: 403 })
    const response = await GET(new Request("https://crm.example/api/marketing/instagram/connect"))
    expect(response.status).toBe(403)
    expect(instagram.createAuthorizationUrl).not.toHaveBeenCalled()
  })
})
