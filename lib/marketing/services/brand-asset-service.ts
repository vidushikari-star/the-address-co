import { createAdminSupabaseClient } from "@/lib/supabase/admin"

export const MARKETING_BRAND_ASSET_BUCKET = "marketing-brand-assets" as const

type Row = Record<string, unknown>

export type ResolvedMarketingLogo = {
  id: string
  storagePath: string
  mimeType: "image/png" | "image/webp"
  width: number | null
  height: number | null
  signedUrl: string
}

/**
 * Resolves a private logo from its canonical bucket for render workers. The
 * database row is the source of truth; callers never reconstruct a storage
 * location from a filename or user-controlled value.
 */
export class BrandAssetService {
  static async resolveLogo(input: {
    assetId?: string | null
    required?: boolean
    activeOnly?: boolean
  } = {}): Promise<ResolvedMarketingLogo | null> {
    const admin = createAdminSupabaseClient()
    let query = admin
      .from("marketing_brand_assets")
      .select("id, storage_path, mime_type, width, height")
      .eq("kind", "logo")

    if (input.assetId) query = query.eq("id", input.assetId)
    if (input.activeOnly ?? true) query = query.eq("active", true)

    const { data, error } = await query.maybeSingle()
    if (error) throw new Error("Unable to resolve the selected brand logo.")
    if (!data) {
      if (input.required) {
        throw new Error("The selected brand logo is unavailable. Choose an active logo or disable the logo and render again.")
      }
      return null
    }

    const row = data as Row
    const mimeType = row.mime_type === "image/png" || row.mime_type === "image/webp"
      ? row.mime_type
      : null
    if (!mimeType) throw new Error("The selected brand logo has an unsupported format.")

    const storagePath = String(row.storage_path ?? "")
    if (!storagePath) throw new Error("The selected brand logo has no storage path.")
    const { data: signed, error: signedError } = await admin.storage
      .from(MARKETING_BRAND_ASSET_BUCKET)
      .createSignedUrl(storagePath, 60 * 60)
    if (signedError || !signed?.signedUrl) {
      throw new Error("Unable to sign the selected brand logo for rendering.")
    }

    return {
      id: String(row.id),
      storagePath,
      mimeType,
      width: typeof row.width === "number" ? row.width : null,
      height: typeof row.height === "number" ? row.height : null,
      signedUrl: signed.signedUrl,
    }
  }
}
