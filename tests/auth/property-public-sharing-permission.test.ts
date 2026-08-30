import { describe, expect, it } from "vitest"

import {
  YASH_PUBLIC_SHARING_PROFILE_ID,
  canManageFinance,
  canManagePropertyPublicSharing,
  canViewAllCommissions,
  isAdmin,
} from "@/lib/auth/permissions"
import type { UserProfile } from "@/types/user"

function profile(id: string, role: UserProfile["role"]): UserProfile {
  return {
    id,
    role,
    name: "CRM user",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

describe("Property Public Sharing capability", () => {
  it("allows admins and only Yash's stable profile ID", () => {
    expect(canManagePropertyPublicSharing(profile("admin-1", "admin"))).toBe(true)
    expect(canManagePropertyPublicSharing(profile(YASH_PUBLIC_SHARING_PROFILE_ID, "sales"))).toBe(true)
    expect(canManagePropertyPublicSharing(profile("11111111-1111-4111-8111-111111111111", "sales"))).toBe(false)
    expect(canManagePropertyPublicSharing(null)).toBe(false)
  })

  it("does not promote Yash to any existing admin capability", () => {
    const yash = profile(YASH_PUBLIC_SHARING_PROFILE_ID, "sales")

    expect(isAdmin(yash)).toBe(false)
    expect(canManageFinance(yash)).toBe(false)
    expect(canViewAllCommissions(yash)).toBe(false)
  })
})
