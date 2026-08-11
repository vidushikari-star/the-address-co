import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const runtime = "nodejs"

const MAX_LOGO_BYTES = 5 * 1024 * 1024
const LOGO_FORMATS = {
  png: { mimeType: "image/png", declared: ["image/png"] },
  webp: { mimeType: "image/webp", declared: ["image/webp"] },
} as const

function logoFormat(file: File) {
  const extension = file.name.split(".").pop()?.toLocaleLowerCase()
  const format = extension ? LOGO_FORMATS[extension as keyof typeof LOGO_FORMATS] : undefined
  if (!format || (file.type && !format.declared.includes(file.type.toLocaleLowerCase() as never))) {
    throw new Error("Upload a PNG or WebP logo. SVG is not accepted because this renderer has no hardened SVG rasterisation path.")
  }
  return { extension, mimeType: format.mimeType }
}

export async function GET() {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  try {
    return NextResponse.json({ logo: await MarketingRepository.getActiveBrandLogo() })
  } catch {
    return NextResponse.json({ error: "Unable to load the active brand logo." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    if (!(file instanceof File) || !file.size) return NextResponse.json({ error: "Choose a PNG or WebP logo." }, { status: 400 })
    if (file.size > MAX_LOGO_BYTES) return NextResponse.json({ error: "Brand logos must be 5 MB or smaller." }, { status: 400 })
    const format = logoFormat(file)
    const storagePath = `${access.user.id}/${crypto.randomUUID()}.${format.extension}`
    const supabase = await createServerSupabaseClient()
    const bytes = new Uint8Array(await file.arrayBuffer())
    const { error: uploadError } = await supabase.storage
      .from("marketing-brand-assets")
      .upload(storagePath, bytes, { contentType: format.mimeType, upsert: false })
    if (uploadError) throw uploadError
    try {
      const logo = await MarketingRepository.createBrandLogo({
        storagePath,
        filename: file.name.slice(0, 255),
        mimeType: format.mimeType,
        createdBy: access.user.id,
      })
      await MarketingRepository.addAuditLog({ actorId: access.user.id, action: "brand_logo.uploaded", metadata: { logoId: logo.id, mimeType: logo.mimeType } })
      return NextResponse.json({ logo }, { status: 201 })
    } catch (error) {
      await supabase.storage.from("marketing-brand-assets").remove([storagePath])
      throw error
    }
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to upload the brand logo." }, { status: 400 })
  }
}

export async function DELETE() {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })
  try {
    const removed = await MarketingRepository.removeActiveBrandLogo()
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.storage.from("marketing-brand-assets").remove([removed.storagePath])
    if (error) console.warn("Brand logo record was removed but storage cleanup failed:", error.message)
    await MarketingRepository.addAuditLog({ actorId: access.user.id, action: "brand_logo.removed", metadata: { logoId: removed.id } })
    return NextResponse.json({ removed: true })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to remove the brand logo." }, { status: 400 })
  }
}
