import { beforeEach, describe, expect, it, vi } from "vitest"

const server = vi.hoisted(() => ({ createServerSupabaseClient: vi.fn() }))

vi.mock("@/lib/supabase/server", () => server)

import { getServerUserProfile } from "@/lib/auth/server-user-profile"
import { YASH_PUBLIC_SHARING_PROFILE_ID, canManagePropertyPublicSharing } from "@/lib/auth/permissions"

const yashAuthUserId = "5a1cd0bc-e9db-430b-890e-bef393cf104b"

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getServerUserProfile", () => {
  it("uses the authenticated auth.users UUID as the canonical user_profiles ID for Yash", async () => {
    const profileQuery = {
      select: vi.fn(),
      eq: vi.fn(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: {
          id: yashAuthUserId,
          name: "Yash",
          email: null,
          role: "sales",
          created_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-01T00:00:00.000Z",
        },
        error: null,
      }),
    }
    profileQuery.select.mockReturnValue(profileQuery)
    profileQuery.eq.mockReturnValue(profileQuery)
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: yashAuthUserId } }, error: null })
    const from = vi.fn().mockReturnValue(profileQuery)
    server.createServerSupabaseClient.mockResolvedValue({ auth: { getUser }, from })

    const profile = await getServerUserProfile()

    expect(yashAuthUserId).toBe(YASH_PUBLIC_SHARING_PROFILE_ID)
    expect(getUser).toHaveBeenCalledOnce()
    expect(from).toHaveBeenCalledWith("user_profiles")
    expect(profileQuery.eq).toHaveBeenCalledWith("id", yashAuthUserId)
    expect(profile).toMatchObject({ id: yashAuthUserId, role: "sales" })
    expect(canManagePropertyPublicSharing(profile)).toBe(true)
  })
})
