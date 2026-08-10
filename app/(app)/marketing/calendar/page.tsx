import { MarketingPageHeader } from "@/components/marketing/marketing-page-header"
import { MarketingStatusPill } from "@/components/marketing/status-pill"
import { requireMarketingAdminPage } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

export default async function MarketingCalendarPage() {
  await requireMarketingAdminPage()
  const [content, settings] = await Promise.all([
    MarketingRepository.listContent({ limit: 100 }),
    MarketingRepository.getBrandSettings(),
  ])
  const ordered = content.filter(item => item.proposedPublishAt).sort((a, b) => new Date(a.proposedPublishAt!).valueOf() - new Date(b.proposedPublishAt!).valueOf())
  return <><MarketingPageHeader pathname="/marketing/calendar" eyebrow="Publishing calendar" title="The plan stays visible before it goes live." description={`This list view shows all planned content in ${settings.timezone}. Drag-and-drop rescheduling is intentionally withheld until content has explicit approval.`} /><main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8"><div className="overflow-hidden rounded-2xl border bg-card">{ordered.length ? ordered.map(item => <div key={item.id} className="flex flex-col gap-3 border-b p-4 last:border-b-0 sm:flex-row sm:items-center"><div className="w-32 text-sm font-semibold">{new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short", minute: "2-digit", timeZone: settings.timezone }).format(new Date(item.proposedPublishAt!))}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold">{item.title || item.propertyName}</p><p className="text-sm text-muted-foreground">{item.propertyLocation} · {item.contentType.replaceAll("_", " ")}</p></div><MarketingStatusPill status={item.status} /></div>) : <p className="p-10 text-center text-sm text-muted-foreground">No approved or planned content is on the calendar yet.</p>}</div></main></>
}
