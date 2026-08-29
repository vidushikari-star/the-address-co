import { NextResponse } from "next/server"

import { requireMarketingApiAccess } from "@/lib/auth/marketing"
import { createServerSupabaseClient } from "@/lib/supabase/server"

type Context = { params: Promise<{ id: string }> }

const PAGE_SIZE = 48
const MAX_PAGE_SIZE = 60

/**
 * Deliberately small, paginated media read for the M3 studio. The browser
 * never needs every full-resolution asset in a large property gallery merely
 * to begin a new Marketing draft.
 */
export async function GET(request: Request, context: Context) {
  const access = await requireMarketingApiAccess()
  if (!access.user) return NextResponse.json({ error: access.error }, { status: access.status! })

  const { id: propertyId } = await context.params
  const url = new URL(request.url)
  const rawOffset = Number(url.searchParams.get("offset") ?? "0")
  const rawLimit = Number(url.searchParams.get("limit") ?? String(PAGE_SIZE))
  const offset = Number.isInteger(rawOffset) && rawOffset >= 0 ? rawOffset : 0
  const limit = Number.isInteger(rawLimit) ? Math.min(Math.max(rawLimit, 1), MAX_PAGE_SIZE) : PAGE_SIZE

  const supabase = await createServerSupabaseClient()
  const { data, error, count } = await supabase
    .from("property_images")
    .select("id, url, media_type, is_cover", { count: "exact" })
    .eq("property_id", propertyId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: "Property media could not be loaded." }, { status: 409 })
  const media = (data ?? []).map(item => ({
    id: String(item.id),
    url: String(item.url),
    type: item.media_type === "video" ? "video" as const : "image" as const,
    isCover: Boolean(item.is_cover),
  }))
  const total = count ?? media.length
  return NextResponse.json({ media, total, nextOffset: offset + media.length < total ? offset + media.length : null })
}
