import { MarketingPageHeader } from "@/components/marketing/marketing-page-header"
import { requireMarketingAdminPage } from "@/lib/auth/marketing"

const templates = [
  ["7-Day New Listing Launch", "A focused launch sequence with a Reel, carousel and story."],
  ["14-Day Luxury Inventory Campaign", "Balanced Reel, carousel, image and infographic cadence."],
  ["Investor Campaign", "Positioning-led content without unverified return claims."],
  ["North Goa Lifestyle Campaign", "Location and lifestyle content grounded in selected inventory."],
]

export default async function MarketingTemplatesPage() {
  await requireMarketingAdminPage()
  return <><MarketingPageHeader pathname="/marketing/templates" eyebrow="Campaign templates" title="Repeat a strategy, not the same creative." description="Templates define duration, cadence and format mix. Every generated item still receives fresh, inventory-grounded copy and your approval." /><main className="mx-auto grid w-full max-w-7xl gap-4 p-4 sm:grid-cols-2 sm:p-6 lg:p-8">{templates.map(([title, description]) => <article key={title} className="rounded-2xl border bg-card p-5"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p><p className="mt-4 text-xs font-semibold text-primary uppercase">Ready for campaign planner</p></article>)}</main></>
}
