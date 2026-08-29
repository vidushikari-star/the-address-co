import { CreateContentStudio } from "@/components/marketing/create-content-studio"
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header"
import { requireMarketingAdminPage } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { createServerSupabaseClient } from "@/lib/supabase/server"

type Props = { searchParams: Promise<{ property?: string }> }

export default async function MarketingCreatePage({ searchParams }: Props) {
  await requireMarketingAdminPage()
  const supabase = await createServerSupabaseClient()
  const [[{ data }, { data: propertyMedia }], activeLogo] = await Promise.all([
    Promise.all([
      supabase.from("properties").select("id, name, location, cover_image, status, price, bedrooms, bathrooms").order("created_at", { ascending: false }),
      supabase.from("property_images").select("property_id, media_type"),
    ]),
    MarketingRepository.getActiveBrandLogo(),
  ])
  const mediaCounts = new Map<string, { imageCount: number; videoCount: number }>()
  for (const media of propertyMedia ?? []) {
    const count = mediaCounts.get(media.property_id) ?? { imageCount: 0, videoCount: 0 }
    if (media.media_type === "video") count.videoCount += 1
    else count.imageCount += 1
    mediaCounts.set(media.property_id, count)
  }
  const properties = (data ?? []).map(property => {
    const price = property.price && typeof property.price === "object" && !Array.isArray(property.price)
      ? (property.price as { asking?: unknown; rent?: unknown }).asking ?? (property.price as { rent?: unknown }).rent
      : undefined
    return {
      id: property.id,
      name: property.name,
      location: property.location ?? "",
      coverImage: property.cover_image ?? undefined,
      status: property.status ?? undefined,
      price: price ? String(price) : undefined,
      configuration: [property.bedrooms ? `${property.bedrooms} bed` : null, property.bathrooms ? `${property.bathrooms} bath` : null].filter(Boolean).join(" · ") || undefined,
      media: mediaCounts.get(property.id) ?? { imageCount: 0, videoCount: 0 },
    }
  })
  const { property } = await searchParams

  return <><MarketingPageHeader pathname="/marketing/create" eyebrow="Luxury content studio" title="Build from the property, not a prompt." description="Curate the real listing media, set the editorial brief, and create a grounded draft for review." /><main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8"><CreateContentStudio properties={properties} initialPropertyId={property} activeBrandLogo={activeLogo ? { id: activeLogo.id, filename: activeLogo.filename, width: activeLogo.width ?? null, height: activeLogo.height ?? null, previewUrl: activeLogo.signedUrl ?? null } : null} /></main></>
}
