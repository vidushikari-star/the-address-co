import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"

const router = vi.hoisted(() => ({ refresh: vi.fn() }))

vi.mock("next/navigation", () => ({ useRouter: () => router }))

import { PublicShareSettings } from "@/components/properties/public-share-settings"
import { YASH_PUBLIC_SHARING_PROFILE_ID, canManagePropertyPublicSharing } from "@/lib/auth/permissions"

const token = "b2041f1f-89e9-4a59-a8de-00169502f523"
const property = {
  id: "95d4ae27-6867-4313-b3b9-62c6bb56960c",
  publicShareEnabled: true,
  publicShareToken: token,
}

function markup(canManage: boolean) {
  return renderToStaticMarkup(createElement(PublicShareSettings, {
    canManage,
    property,
    images: [],
    documents: [],
  }))
}

describe("Property Detail Public Sharing controls", () => {
  it("shows the existing management controls to admins", () => {
    const value = markup(canManagePropertyPublicSharing({ id: "admin-1", role: "admin", name: "Admin", createdAt: "", updatedAt: "" }))

    expect(value).toContain("Enable public sharing")
    expect(value).toContain("Save public share settings")
    expect(value).toContain("Copy public link")
  })

  it("shows Yash the same management controls without an admin role", () => {
    const value = markup(canManagePropertyPublicSharing({ id: YASH_PUBLIC_SHARING_PROFILE_ID, role: "sales", name: "Yash", createdAt: "", updatedAt: "" }))

    expect(value).toContain("Enable public sharing")
    expect(value).toContain("Save public share settings")
    expect(value).toContain("Copy public link")
  })

  it("hides management controls from other CRM users while preserving an existing public-link control", () => {
    const value = markup(canManagePropertyPublicSharing({ id: "11111111-1111-4111-8111-111111111111", role: "sales", name: "Other user", createdAt: "", updatedAt: "" }))

    expect(value).not.toContain("Enable public sharing")
    expect(value).not.toContain("Save public share settings")
    expect(value).toContain("Copy public link")
  })
})
