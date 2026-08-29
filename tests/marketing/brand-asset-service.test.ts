import { beforeEach, describe, expect, it, vi } from "vitest"

const admin = vi.hoisted(() => ({
  client: {
    from: vi.fn(),
    storage: { from: vi.fn() },
  },
}))

vi.mock("@/lib/supabase/admin", () => ({ createAdminSupabaseClient: () => admin.client }))

import { BrandAssetService, MARKETING_BRAND_ASSET_BUCKET } from "@/lib/marketing/services/brand-asset-service"

function logoQuery(result: { data: Record<string, unknown> | null; error: unknown }) {
  const query = { select: vi.fn(), eq: vi.fn(), maybeSingle: vi.fn() }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  query.maybeSingle.mockResolvedValue(result)
  return query
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("BrandAssetService", () => {
  it("resolves a selected Story logo from the private marketing-brand-assets bucket", async () => {
    const query = logoQuery({
      data: {
        id: "8ae7a13d-bcaa-4b58-9355-c3d161f8ae42",
        storage_path: "admin/brand-logo.png",
        mime_type: "image/png",
        width: 512,
        height: 128,
      },
      error: null,
    })
    const storage = { createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://project.supabase.co/storage/v1/object/sign/logo" }, error: null }) }
    admin.client.from.mockReturnValue(query)
    admin.client.storage.from.mockReturnValue(storage)

    await expect(BrandAssetService.resolveLogo({
      assetId: "8ae7a13d-bcaa-4b58-9355-c3d161f8ae42",
      activeOnly: true,
      required: true,
    })).resolves.toMatchObject({
      storagePath: "admin/brand-logo.png",
      mimeType: "image/png",
      signedUrl: "https://project.supabase.co/storage/v1/object/sign/logo",
    })

    expect(admin.client.storage.from).toHaveBeenCalledWith(MARKETING_BRAND_ASSET_BUCKET)
    expect(storage.createSignedUrl).toHaveBeenCalledWith("admin/brand-logo.png", 60 * 60)
  })

  it("reports a missing selected logo with an actionable render error", async () => {
    admin.client.from.mockReturnValue(logoQuery({ data: null, error: null }))

    await expect(BrandAssetService.resolveLogo({ assetId: "missing-logo", activeOnly: true, required: true }))
      .rejects.toThrow("The selected brand logo is unavailable. Choose an active logo or disable the logo and render again.")
    expect(admin.client.storage.from).not.toHaveBeenCalled()
  })
})
