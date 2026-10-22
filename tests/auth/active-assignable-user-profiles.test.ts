import { describe, expect, it, vi } from "vitest"

import { getActiveAssignableUserProfilesForClient } from "@/lib/repositories/active-user-profile-query"

const vidushi = {
  id: "9cd82d14-2ea2-4a57-a18b-5222a590b417",
  name: "Vidushi Kari",
  email: "vidushikari@gmail.com",
  role: "admin" as const,
  is_active: true,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
}

describe("active assignable CRM profiles", () => {
  it("queries only active profiles, retaining active admins and excluding inactive advisors", async () => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      order: vi.fn().mockResolvedValue({ data: [vidushi], error: null }),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    const from = vi.fn().mockReturnValue(query)

    const profiles = await getActiveAssignableUserProfilesForClient({ from } as never)

    expect(from).toHaveBeenCalledWith("user_profiles")
    expect(query.eq).toHaveBeenCalledWith("is_active", true)
    expect(profiles).toEqual([
      expect.objectContaining({ id: vidushi.id, name: "Vidushi Kari", role: "admin", isActive: true }),
    ])
    expect(profiles.map((profile) => profile.id)).not.toContain("4d490fdf-c842-492f-9d68-3c11e0718af9")
    expect(profiles.map((profile) => profile.id)).not.toContain("5a1cd0bc-e9db-430b-890e-bef393cf104b")
  })
})
