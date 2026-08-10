import { CreateContentStudio } from "@/components/marketing/create-content-studio"
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header"
import { requireMarketingAdminPage } from "@/lib/auth/marketing"
import { createServerSupabaseClient } from "@/lib/supabase/server"

type Props = { searchParams: Promise<{ property?: string }> }

export default async function MarketingCreatePage({ searchParams }: Props) {
  await requireMarketingAdminPage()
  const supabase = await createServerSupabaseClient()
  const { data } = await supabase.from("properties").select("id, name, location, cover_image, status, price").order("created_at", { ascending: false })
  const properties = (data ?? []).map(property => {
    const price = property.price && typeof property.price === "object" && !Array.isArray(property.price)
      ? (property.price as { asking?: unknown; rent?: unknown }).asking ?? (property.price as { rent?: unknown }).rent
      : undefined
    return { id: property.id, name: property.name, location: property.location ?? "", coverImage: property.cover_image ?? undefined, status: property.status ?? undefined, price: price ? String(price) : undefined }
  })
  const { property } = await searchParams

  return <><MarketingPageHeader pathname="/marketing/create" eyebrow="Create content" title="Start with the inventory you trust." description="Select an existing property, choose a content type and direction, and the studio will create a grounded creative draft. Reels can be rendered after approval." /><main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8"><CreateContentStudio properties={properties} initialPropertyId={property} /></main></>
}
