/* eslint-disable @next/next/no-img-element */

import Link from "next/link"

import { MarketingContentCard } from "@/components/marketing/content-card"
import { MarketingContentEditor } from "@/components/marketing/content-editor"
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header"
import { MarketingPublishingActions } from "@/components/marketing/marketing-publishing-actions"
import { requireMarketingAdminPage } from "@/lib/auth/marketing"
import { isInstagramPublishingEnabled } from "@/lib/marketing/feature-flags"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { MARKETING_STATUSES } from "@/lib/marketing/types"

type Props = { searchParams: Promise<{ status?: string; selected?: string; property?: string; generationError?: string }> }

export default async function MarketingContentPage({ searchParams }: Props) {
  await requireMarketingAdminPage()
  const { status, selected, property, generationError } = await searchParams
  const activeStatus = MARKETING_STATUSES.includes(status as never) ? status as (typeof MARKETING_STATUSES)[number] : undefined
  const content = await MarketingRepository.listContent({ status: activeStatus, propertyId: property })
  const selectedContent = selected ? await MarketingRepository.getContentById(selected) : null

  const canEdit = ["draft", "changes_requested", "ready_for_review", "failed"].includes(selectedContent?.content.status ?? "")
  const canPublishNow = isInstagramPublishingEnabled()
  return <><MarketingPageHeader pathname="/marketing/content" eyebrow="Content library" title="Every creative decision, in one place." description="Search, preview, edit and trace the property source for drafts, scheduled content and published Instagram history." action={<Link href="/marketing/create" className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Create content</Link>} /><main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{generationError && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">AI generation failed: {generationError}</p>}<div className="mb-6 flex flex-wrap gap-2"><Link href={property ? `/marketing/content?property=${property}` : "/marketing/content"} className={`rounded-full px-3 py-1.5 text-sm ${!activeStatus ? "bg-primary text-primary-foreground" : "bg-card border"}`}>All</Link>{MARKETING_STATUSES.map(item => <Link key={item} href={`/marketing/content?status=${item}${property ? `&property=${property}` : ""}`} className={`rounded-full px-3 py-1.5 text-sm capitalize ${activeStatus === item ? "bg-primary text-primary-foreground" : "bg-card border hover:bg-muted"}`}>{item.replaceAll("_", " ")}</Link>)}</div>{selectedContent && <section className="mb-7 overflow-hidden rounded-2xl border bg-card"><div className="grid lg:grid-cols-[0.65fr_0.35fr]"><div className="grid gap-3 bg-muted p-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{selectedContent.content.renderedUrl ? <video className="aspect-[9/16] w-full bg-black object-contain" controls src={selectedContent.content.renderedUrl} /> : <div className="aspect-[4/3] bg-muted" />}{selectedContent.assets.find(asset => asset.kind === "original_reference")?.sourceUrl && <div><p className="mb-2 text-xs font-semibold text-muted-foreground">Original CRM asset</p><img className="aspect-[4/3] w-full rounded-lg object-cover" src={selectedContent.assets.find(asset => asset.kind === "original_reference")?.sourceUrl ?? ""} alt="Original property media" /></div>}</div><div className="space-y-4 p-5"><p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Selected content</p><h2 className="text-xl font-semibold">{selectedContent.content.title}</h2><p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">Audio: {String((selectedContent.content.composition as { audio?: { label?: string } }).audio?.label || "No audio selected")}</p>{canEdit && <MarketingContentEditor content={selectedContent.content} />}{selectedContent.content.status === "approved" && <MarketingPublishingActions contentId={selectedContent.content.id} canPublishNow={canPublishNow} />}{!canEdit && selectedContent.content.status !== "approved" && <><p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{selectedContent.content.caption}</p><p className="text-sm text-primary">{selectedContent.content.hashtags.join(" ")}</p></>}</div></div></section>}{content.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{content.map(item => <MarketingContentCard key={item.id} content={item} />)}</div> : <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">No content matches this view.</div>}</main></>
}
