/* eslint-disable @next/next/no-img-element */

import Link from "next/link"

import { ContentWorkflowActions } from "@/components/marketing/content-workflow-actions"
import { CarouselMediaPreview } from "@/components/marketing/carousel-media-preview"
import { CarouselMediaEditor } from "@/components/marketing/carousel-media-editor"
import { MarketingContentEditor } from "@/components/marketing/content-editor"
import { MarketingContentLibrary } from "@/components/marketing/marketing-content-library"
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header"
import { ReelAudioControls } from "@/components/marketing/reel-audio-controls"
import { ReelPreviewPanel } from "@/components/marketing/reel-preview-panel"
import { ReelVersionControls } from "@/components/marketing/reel-version-controls"
import { ReelLogoControls } from "@/components/marketing/reel-logo-controls"
import { StoryCreativeEditor } from "@/components/marketing/story-creative-editor"
import { StoryPreviewPanel } from "@/components/marketing/story-preview-panel"
import { MarketingStatusPill } from "@/components/marketing/status-pill"
import { requireMarketingAdminPage } from "@/lib/auth/marketing"
import { carouselAssetValidationError, carouselAssets, hasPublishableMedia, publishableAssets } from "@/lib/marketing/content-delivery"
import { isInstagramPublishingEnabled } from "@/lib/marketing/feature-flags"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { editableReelVersion } from "@/lib/marketing/reel-version-state"
import { MARKETING_STATUSES } from "@/lib/marketing/types"

type Props = { searchParams: Promise<{ status?: string; selected?: string; property?: string; generationError?: string }> }

export default async function MarketingContentPage({ searchParams }: Props) {
  await requireMarketingAdminPage()
  const { status, selected, property, generationError } = await searchParams
  const activeStatus = MARKETING_STATUSES.includes(status as never) ? status as (typeof MARKETING_STATUSES)[number] : undefined
  const content = await MarketingRepository.listContent({ status: activeStatus, propertyId: property })
  const selectedContent = selected ? await MarketingRepository.getContentById(selected) : null
  const publication = selectedContent ? await MarketingRepository.getPublicationForContent(selectedContent.content.id) : null
  const reelVersions = selectedContent?.content.contentType === "reel"
    ? await MarketingRepository.listReelVersions(selectedContent.content.id)
    : []
  const audioTracks = selectedContent?.content.contentType === "reel"
    ? await MarketingRepository.listAudioTracks()
    : []
  const [brandSettings, activeLogo] = ["reel", "story"].includes(selectedContent?.content.contentType ?? "")
    ? await Promise.all([MarketingRepository.getBrandSettings(), MarketingRepository.getActiveBrandLogo()])
    : [null, null]

  const canEdit = ["draft", "changes_requested", "ready_for_review", "failed"].includes(selectedContent?.content.status ?? "")
  const canEditStory = selectedContent?.content.contentType === "story" && ["draft", "changes_requested", "ready_for_review", "failed", "rendering"].includes(selectedContent.content.status)
  const draftReelVersion = editableReelVersion(reelVersions)
  const hasApprovedVersionAwaitingRender = reelVersions.some(version => version.status === "approved" && !version.renderedAssetId)
  const publishingEnabled = isInstagramPublishingEnabled()
  const hasReadyMedia = selectedContent ? hasPublishableMedia(selectedContent.content, selectedContent.assets) : false
  const selectedCarouselSources = selectedContent?.content.contentType === "carousel"
    ? carouselAssets(selectedContent.content, selectedContent.assets)
    : []
  const selectedCarouselAssets = selectedContent?.content.contentType === "carousel"
    ? publishableAssets(selectedContent.content, selectedContent.assets)
    : []
  const carouselMediaError = selectedContent?.content.contentType === "carousel"
    ? carouselAssetValidationError(selectedContent.content, selectedContent.assets)
    : null
  const carouselGallery = selectedContent?.content.contentType === "carousel" && selectedContent.content.primaryPropertyId
    ? await MarketingRepository.listPropertyGalleryImages(selectedContent.content.primaryPropertyId)
    : []
  const canEditCarouselMedia = selectedContent?.content.contentType === "carousel" && ["draft", "changes_requested", "ready_for_review", "failed", "approved"].includes(selectedContent.content.status)
  const selectedCarouselPropertyImageIds = selectedCarouselSources
    .map(asset => asset.propertyImageId)
    .filter((id): id is string => Boolean(id))
  return <><MarketingPageHeader pathname="/marketing/content" eyebrow="Content library" title="Every creative decision, in one place." description="Search, preview, edit and trace the property source for drafts, scheduled content and published Instagram history." action={<Link href="/marketing/create" className="inline-flex h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">Create content</Link>} /><main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{generationError && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">AI generation failed: {generationError}</p>}{!publishingEnabled && <p className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Instagram publishing is currently disabled for staging. You can still generate, approve, render, and schedule content safely.</p>}<div className="mb-6 flex flex-wrap gap-2"><Link href={property ? `/marketing/content?property=${property}` : "/marketing/content"} className={`rounded-full px-3 py-1.5 text-sm ${!activeStatus ? "bg-primary text-primary-foreground" : "bg-card border"}`}>All</Link>{MARKETING_STATUSES.map(item => <Link key={item} href={`/marketing/content?status=${item}${property ? `&property=${property}` : ""}`} className={`rounded-full px-3 py-1.5 text-sm capitalize ${activeStatus === item ? "bg-primary text-primary-foreground" : "bg-card border hover:bg-muted"}`}>{item.replaceAll("_", " ")}</Link>)}</div>{selectedContent && <section className="mb-7 overflow-hidden rounded-2xl border bg-card"><div className="grid lg:grid-cols-[0.65fr_0.35fr]"><div className="grid gap-3 bg-muted p-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">{selectedContent.content.contentType === "reel" ? <ReelPreviewPanel content={selectedContent.content} versions={reelVersions} assets={selectedContent.assets} tracks={audioTracks} /> : selectedContent.content.contentType === "carousel" ? <CarouselMediaPreview assets={selectedCarouselAssets} /> : selectedContent.content.contentType === "story" ? <StoryPreviewPanel content={selectedContent.content} /> : selectedContent.content.renderedUrl ? <img className="aspect-[4/5] w-full rounded-lg bg-black object-contain" src={selectedContent.content.renderedUrl} alt="Rendered Instagram Feed Post" /> : <div className="aspect-[4/5] bg-muted" />}{selectedContent.content.contentType !== "carousel" && selectedContent.assets.find(asset => asset.kind === "original_reference")?.sourceUrl && <div><p className="mb-2 text-xs font-semibold text-muted-foreground">Original CRM asset</p><img className="aspect-[4/3] w-full rounded-lg object-cover" src={selectedContent.assets.find(asset => asset.kind === "original_reference")?.sourceUrl ?? ""} alt="Original property media" /></div>}</div><div className="space-y-4 p-5"><div className="flex flex-wrap items-center gap-2"><p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Selected content</p><MarketingStatusPill status={selectedContent.content.status} /></div><h2 className="text-xl font-semibold">{selectedContent.content.title}</h2>{carouselMediaError && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">{carouselMediaError} Use Edit Carousel Media to correct the ordered image set.</p>}{selectedContent.content.contentType === "reel" && <ReelAudioControls content={selectedContent.content} tracks={audioTracks} draftVersion={draftReelVersion} />}{canEdit && selectedContent.content.contentType === "reel" && brandSettings && <ReelLogoControls content={selectedContent.content} settings={brandSettings} hasActiveLogo={Boolean(activeLogo)} />}{canEditStory && <StoryCreativeEditor content={selectedContent.content} assets={selectedContent.assets} hasActiveLogo={Boolean(activeLogo)} />}{canEditCarouselMedia && <CarouselMediaEditor contentId={selectedContent.content.id} status={selectedContent.content.status} gallery={carouselGallery} selectedPropertyImageIds={selectedCarouselPropertyImageIds} />}{canEdit && selectedContent.content.contentType !== "story" && <MarketingContentEditor content={selectedContent.content} />}{!canEdit && selectedContent.content.contentType !== "story" && <><p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{selectedContent.content.caption}</p><p className="text-sm text-primary">{selectedContent.content.hashtags.join(" ")}</p></>}<ContentWorkflowActions content={selectedContent.content} hasReadyMedia={hasReadyMedia} publishingEnabled={publishingEnabled} publication={publication} hasApprovedVersionAwaitingRender={hasApprovedVersionAwaitingRender} />{selectedContent.content.contentType === "reel" && <ReelVersionControls content={selectedContent.content} versions={reelVersions} assets={selectedContent.assets} />}</div></div></section>}<MarketingContentLibrary content={content} /></main></>
}
