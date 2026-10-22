import { beforeEach, describe, expect, it, vi } from "vitest"

const server = vi.hoisted(() => ({ createServerSupabaseClient: vi.fn() }))

vi.mock("@/lib/supabase/server", () => server)

import { getServerUserProfile } from "@/lib/auth/server-user-profile"

const authUserId = "5a1cd0bc-e9db-430b-890e-bef393cf104b"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getServerUserProfile", () => {
  it("allows an authenticated active CRM profile", async () => {
    const profileQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: authUserId,
          name: "CRM user",
          email: null,
          role: "sales",
          is_active: true,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
        error: null,
      }),
    }
    profileQuery.select.mockReturnValue(profileQuery)
    profileQuery.eq.mockReturnValue(profileQuery)
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: authUserId } }, error: null })
    const from = vi.fn().mockReturnValue(profileQuery)
    server.createServerSupabaseClient.mockResolvedValue({ auth: { getUser }, from })

    const profile = await getServerUserProfile()

    expect(getUser).toHaveBeenCalledOnce()
    expect(from).toHaveBeenCalledWith("user_profiles")
    expect(profileQuery.eq).toHaveBeenCalledWith("id", authUserId)
    expect(profile).toMatchObject({ id: authUserId, role: "sales", isActive: true })
  })

  it("denies an authenticated inactive CRM profile", async () => {
    const profileQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: authUserId,
          name: "Inactive CRM user",
          email: null,
          role: "sales",
          is_active: false,
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
        error: null,
      }),
    }
    profileQuery.select.mockReturnValue(profileQuery)
    profileQuery.eq.mockReturnValue(profileQuery)
    server.createServerSupabaseClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: authUserId } }, error: null }) },
      from: vi.fn().mockReturnValue(profileQuery),
    })

    await expect(getServerUserProfile()).resolves.toBeNull()
  })

  it("denies authenticated users with no CRM profile and anonymous callers", async () => {
    const profileQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }
    profileQuery.select.mockReturnValue(profileQuery)
    profileQuery.eq.mockReturnValue(profileQuery)
    const getUser = vi.fn()
      .mockResolvedValueOnce({ data: { user: { id: authUserId } }, error: null })
      .mockResolvedValueOnce({ data: { user: null }, error: null })
    server.createServerSupabaseClient.mockResolvedValue({
      auth: { getUser },
      from: vi.fn().mockReturnValue(profileQuery),
    })

    await expect(getServerUserProfile()).resolves.toBeNull()
    await expect(getServerUserProfile()).resolves.toBeNull()
  })
})
