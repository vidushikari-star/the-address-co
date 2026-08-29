"use client"
/* eslint-disable @next/next/no-img-element */

import { ArrowLeft, ArrowRight, Check, Eye, ImageIcon, Loader2, Search, Sparkles, Video, X } from "lucide-react"
import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MARKETING_FORMATS, MARKETING_OBJECTIVES, type MarketingFormat, type MarketingObjective } from "@/lib/marketing/types"

type PropertyMedia = {
  id: string
  url: string
  type: "image" | "video"
  isCover: boolean
}

type PropertyOption = {
  id: string
  name: string
  location: string
  price?: string
  coverImage?: string
  status?: string
  configuration?: string
  media: { imageCount: number; videoCount: number }
}

type BrandTreatment = {
  enabled: boolean
  placement: "auto" | "top_left" | "top_right" | "bottom_left" | "bottom_right" | "end_card_only"
  scale: "small" | "medium" | "large"
  opacity: number
}

type StoredStudioDraft = {
  propertyId: string
  format: MarketingFormat
  objective: MarketingObjective
  selectedMediaIds: string[]
  brandTreatment: BrandTreatment
}

type ActiveBrandLogo = { id: string; filename: string; width: number | null; height: number | null; previewUrl: string | null }

const STUDIO_DRAFT_KEY = "marketing-v2-m3-studio"
const MEDIA_PAGE_SIZE = 48

const formatDetails: Record<MarketingFormat, { label: string; description: string; output: string }> = {
  feed_single: { label: "Post", description: "One clean property image with an editorial caption.", output: "4:5 feed image" },
  carousel: { label: "Carousel", description: "Tell the property story across selected images.", output: "2–10 clean feed images" },
  story: { label: "Story", description: "Vertical creative with an elegant deterministic text treatment.", output: "9:16 Story" },
  reel: { label: "Reel", description: "Build a cinematic sequence from property media.", output: "9:16 video" },
}

const objectiveLabels: Record<MarketingObjective, string> = {
  new_listing: "New Listing",
  property_spotlight: "Property Spotlight",
  architecture: "Architecture",
  interiors: "Interiors",
  amenities_features: "Amenities",
  lifestyle: "Lifestyle",
  location: "Location",
  investment: "Investment",
  price_update: "Price Update",
  availability: "Availability",
  construction_update: "Construction Update",
  open_house: "Open House",
  recently_sold: "Recently Sold",
  brand_editorial: "Brand / Editorial",
}

const defaultBrandTreatment: BrandTreatment = { enabled: false, placement: "auto", scale: "small", opacity: 0.8 }

function loadStoredDraft(initialPropertyId?: string): StoredStudioDraft {
  const fallback: StoredStudioDraft = {
    propertyId: initialPropertyId ?? "",
    format: "reel",
    objective: "property_spotlight",
    selectedMediaIds: [],
    brandTreatment: defaultBrandTreatment,
  }
  if (typeof window === "undefined") return fallback
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(STUDIO_DRAFT_KEY) ?? "null") as Partial<StoredStudioDraft> | null
    if (!stored || !MARKETING_FORMATS.includes(stored.format as MarketingFormat) || !MARKETING_OBJECTIVES.includes(stored.objective as MarketingObjective)) return fallback
    return {
      propertyId: typeof stored.propertyId === "string" ? stored.propertyId : fallback.propertyId,
      format: stored.format as MarketingFormat,
      objective: stored.objective as MarketingObjective,
      selectedMediaIds: Array.isArray(stored.selectedMediaIds) ? stored.selectedMediaIds.filter((id): id is string => typeof id === "string") : [],
      brandTreatment: { ...defaultBrandTreatment, ...stored.brandTreatment },
    }
  } catch {
    return fallback
  }
}

function formatAvailability(property: PropertyOption | undefined, format: MarketingFormat) {
  if (!property) return "Select an inventory property first."
  const { imageCount, videoCount } = property.media
  if (format === "feed_single" && imageCount < 1) return "Post requires one accessible property image."
  if (format === "carousel" && imageCount < 2) return "Carousel requires at least two accessible property images."
  if (format === "story" && imageCount < 1) return "Story requires one accessible property image."
  if (format === "reel" && imageCount + videoCount < 1) return "Reel requires at least one accessible property image or video."
  return null
}

export function allowedStudioMedia(format: MarketingFormat, item: Pick<PropertyMedia, "type">) {
  return format === "reel" || item.type === "image"
}

export function studioSelectionBounds(format: MarketingFormat) {
  if (format === "carousel") return { minimum: 2, maximum: 10 }
  if (format === "reel") return { minimum: 1, maximum: 12 }
  return { minimum: 1, maximum: 1 }
}

const selectionBounds = studioSelectionBounds

export function studioSelectionError(format: MarketingFormat, selectedMediaIds: string[], media: PropertyMedia[]) {
  const { minimum, maximum } = studioSelectionBounds(format)
  if (selectedMediaIds.length < minimum || selectedMediaIds.length > maximum) {
    return minimum === maximum
      ? `${formatDetails[format].label} needs exactly one selected property image.`
      : `${formatDetails[format].label} needs ${minimum}–${maximum} selected property media items.`
  }
  const mediaById = new Map(media.map(item => [item.id, item]))
  const invalid = selectedMediaIds.map(id => mediaById.get(id)).find(item => !item || !allowedStudioMedia(format, item))
  if (invalid) return format === "reel" ? "One selected item is no longer available. Choose it again before generating." : "Only still property images can be selected for this format."
  return null
}

export function reorderStudioMedia(ids: string[], id: string, direction: -1 | 1) {
  const index = ids.indexOf(id)
  const destination = index + direction
  if (index < 0 || destination < 0 || destination >= ids.length) return ids
  const next = [...ids]
  ;[next[index], next[destination]] = [next[destination], next[index]]
  return next
}

function creationFields(format: MarketingFormat) {
  if (format === "story") return "headline, supporting line, concise highlights, and CTA"
  if (format === "reel") return "hook, short overlay guidance, caption, and storyboard sequence"
  return "editorial angle, caption, CTA, hashtags, and accessible alt text"
}

export function CreateContentStudio({
  properties,
  initialPropertyId,
  activeBrandLogo,
}: {
  properties: PropertyOption[]
  initialPropertyId?: string
  activeBrandLogo: ActiveBrandLogo | null
}) {
  const router = useRouter()
  const [initialDraft] = useState(() => loadStoredDraft(initialPropertyId))
  const [query, setQuery] = useState("")
  const [propertyId, setPropertyId] = useState(initialDraft.propertyId || properties[0]?.id || "")
  const [format, setFormat] = useState<MarketingFormat>(initialDraft.format)
  const [objective, setObjective] = useState<MarketingObjective>(initialDraft.objective)
  const [selectedMediaIds, setSelectedMediaIds] = useState(initialDraft.selectedMediaIds)
  const [brandTreatment, setBrandTreatment] = useState<BrandTreatment>(initialDraft.brandTreatment)
  const [media, setMedia] = useState<PropertyMedia[]>([])
  const [mediaTotal, setMediaTotal] = useState(0)
  const [nextOffset, setNextOffset] = useState<number | null>(null)
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generationStage, setGenerationStage] = useState<string | null>(null)
  const [activePreviewIndex, setActivePreviewIndex] = useState(0)
  const [isPending, startTransition] = useTransition()
  const createIdempotencyKey = useRef(crypto.randomUUID())
  const property = properties.find(item => item.id === propertyId)
  const availabilityError = formatAvailability(property, format)
  const mediaSelectionError = studioSelectionError(format, selectedMediaIds, media)
  const selectedMedia = selectedMediaIds.map(id => media.find(item => item.id === id)).filter((item): item is PropertyMedia => Boolean(item))
  const matchingProperties = useMemo(() => properties.filter(item => [item.name, item.location, item.status, item.configuration].join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase())), [properties, query])

  useEffect(() => {
    if (!propertyId) return
    let active = true
    async function loadInitialMedia() {
      setMediaLoading(true)
      setMediaError(null)
      try {
        const response = await fetch(`/api/marketing/properties/${propertyId}/media?limit=${MEDIA_PAGE_SIZE}`)
        const data = await response.json().catch(() => ({})) as { media?: PropertyMedia[]; total?: number; nextOffset?: number | null; error?: string }
        if (!response.ok) throw new Error(data.error ?? "Property media could not be loaded.")
        if (!active) return
        setMedia(data.media ?? [])
        setMediaTotal(data.total ?? data.media?.length ?? 0)
        setNextOffset(typeof data.nextOffset === "number" ? data.nextOffset : null)
      } catch (loadError) {
        if (active) setMediaError(loadError instanceof Error ? loadError.message : "Property media could not be loaded.")
      } finally {
        if (active) setMediaLoading(false)
      }
    }
    void loadInitialMedia()
    return () => { active = false }
  }, [propertyId])

  useEffect(() => {
    if (typeof window === "undefined") return
    window.sessionStorage.setItem(STUDIO_DRAFT_KEY, JSON.stringify({ propertyId, format, objective, selectedMediaIds, brandTreatment } satisfies StoredStudioDraft))
  }, [propertyId, format, objective, selectedMediaIds, brandTreatment])

  useEffect(() => {
    if (activePreviewIndex >= selectedMedia.length) setActivePreviewIndex(Math.max(0, selectedMedia.length - 1))
  }, [activePreviewIndex, selectedMedia.length])

  async function loadMoreMedia() {
    if (nextOffset === null || mediaLoading) return
    setMediaLoading(true)
    setMediaError(null)
    try {
      const response = await fetch(`/api/marketing/properties/${propertyId}/media?offset=${nextOffset}&limit=${MEDIA_PAGE_SIZE}`)
      const data = await response.json().catch(() => ({})) as { media?: PropertyMedia[]; nextOffset?: number | null; error?: string }
      if (!response.ok) throw new Error(data.error ?? "More property media could not be loaded.")
      setMedia(current => [...current, ...(data.media ?? [])])
      setNextOffset(typeof data.nextOffset === "number" ? data.nextOffset : null)
    } catch (loadError) {
      setMediaError(loadError instanceof Error ? loadError.message : "More property media could not be loaded.")
    } finally {
      setMediaLoading(false)
    }
  }

  function chooseProperty(nextPropertyId: string) {
    if (nextPropertyId === propertyId) return
    const hadSelection = selectedMediaIds.length > 0
    setPropertyId(nextPropertyId)
    setSelectedMediaIds([])
    setMedia([])
    setNextOffset(null)
    setMediaTotal(0)
    setNotice(hadSelection ? "Property changed. The previous property’s curated media has been cleared so it cannot be used by accident." : null)
    setError(null)
  }

  function chooseFormat(nextFormat: MarketingFormat) {
    if (nextFormat === format) return
    const max = studioSelectionBounds(nextFormat).maximum
    const nextSelection = selectedMediaIds
      .map(id => media.find(item => item.id === id))
      .filter((item): item is PropertyMedia => item !== undefined && allowedStudioMedia(nextFormat, item))
      .slice(0, max)
      .map(item => item.id)
    if (nextSelection.length !== selectedMediaIds.length) {
      setNotice(`${formatDetails[nextFormat].label} has different media rules. Incompatible selections were removed; choose the remaining media deliberately.`)
    }
    setSelectedMediaIds(nextSelection)
    setFormat(nextFormat)
    setError(null)
  }

  function toggleMedia(item: PropertyMedia) {
    if (!allowedStudioMedia(format, item)) {
      setNotice("Video is available for Reels. This format uses verified still property images only.")
      return
    }
    const { maximum } = studioSelectionBounds(format)
    setSelectedMediaIds(current => {
      if (current.includes(item.id)) return current.filter(id => id !== item.id)
      if (maximum === 1) return [item.id]
      if (current.length >= maximum) {
        setNotice(`${formatDetails[format].label} supports up to ${maximum} selected media items.`)
        return current
      }
      return [...current, item.id]
    })
    setError(null)
  }

  function moveMedia(id: string, direction: -1 | 1) {
    setSelectedMediaIds(current => reorderStudioMedia(current, id, direction))
  }

  function generate() {
    if (!propertyId) return setError("Select an inventory property first.")
    if (availabilityError) return setError(availabilityError)
    if (mediaSelectionError) return setError(mediaSelectionError)
    if (brandTreatment.enabled && !activeBrandLogo) return setError("Upload an active private brand logo before enabling brand treatment.")
    setError(null)
    startTransition(async () => {
      setGenerationStage("Preparing your grounded draft…")
      const response = await fetch("/api/marketing/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId,
          format,
          objective,
          creativeDirection: "luxury_editorial",
          propertyMediaIds: selectedMediaIds,
          brandTreatment,
          idempotencyKey: createIdempotencyKey.current,
        }),
      })
      const payload = await response.json().catch(() => ({})) as { content?: { id: string }; error?: string }
      if (!response.ok || !payload.content) {
        setGenerationStage(null)
        setError(payload.error || "The Marketing draft could not be created.")
        return
      }
      setGenerationStage(format === "reel" ? "Writing the editorial direction and preparing the Reel storyboard…" : "Writing the editorial copy and preparing your preview…")
      const generated = await fetch(`/api/marketing/content/${payload.content.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const generation = await generated.json().catch(() => ({})) as { error?: string }
      window.sessionStorage.removeItem(STUDIO_DRAFT_KEY)
      if (!generated.ok) {
        router.push(`/marketing/content?selected=${payload.content.id}&generationError=${encodeURIComponent(generation.error || "AI copy generation failed.")}`)
        router.refresh()
        return
      }
      router.push(`/marketing/content?selected=${payload.content.id}`)
      router.refresh()
    })
  }

  const preview = selectedMedia[activePreviewIndex]
  const supportsPlacement = format === "reel"
    ? ["auto", "top_left", "top_right", "bottom_left", "bottom_right", "end_card_only"] as const
    : ["auto", "top_left", "top_right", "bottom_left", "bottom_right"] as const

  return <div className="mx-auto max-w-7xl space-y-8 pb-12">
    <section className="overflow-hidden rounded-3xl border bg-card shadow-sm">
      <div className="border-b bg-muted/35 px-5 py-4 sm:px-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">New editorial draft</p><p className="mt-1 text-sm text-muted-foreground">Choose the real inventory first. AI writes the supporting creative; it never changes the property media.</p></div>
          <div className="rounded-full border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground">Luxury editorial · draft only</div>
        </div>
      </div>
      <div className="grid gap-8 p-5 lg:grid-cols-[0.72fr_1.28fr] lg:p-7">
        <section aria-labelledby="studio-property-heading" className="min-w-0">
          <div className="flex items-end justify-between gap-3"><div><p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">1 · Property</p><h2 id="studio-property-heading" className="mt-1 text-xl font-semibold">Choose inventory</h2></div><span className="text-xs text-muted-foreground">{properties.length} properties</span></div>
          <div className="relative mt-5"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search property or location" className="h-11 rounded-xl pl-9" aria-label="Search properties" /></div>
          <div className="mt-4 max-h-[30rem] space-y-2 overflow-y-auto pr-1">
            {matchingProperties.map(item => <button type="button" onClick={() => chooseProperty(item.id)} key={item.id} aria-pressed={item.id === propertyId} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${item.id === propertyId ? "border-primary bg-primary/[0.04] shadow-sm" : "hover:border-primary/40 hover:bg-muted/35"}`}>
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-muted">{item.coverImage ? <img src={item.coverImage} alt="" className="h-full w-full object-cover" loading="lazy" /> : <ImageIcon className="m-6 h-4 w-4 text-muted-foreground" />}</div>
              <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.name}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.location || "Location retained in inventory"}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{[item.price, item.configuration, item.status].filter(Boolean).join(" · ") || "Property details retained in snapshot"}</span></span>
              {item.id === propertyId && <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"><Check className="h-3.5 w-3.5" /></span>}
            </button>)}
          </div>
        </section>

        <section className="min-w-0">
          {property ? <div className="flex flex-wrap items-center gap-4 border-b pb-6"><div className="h-20 w-28 overflow-hidden rounded-2xl bg-muted">{property.coverImage ? <img src={property.coverImage} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="m-8 h-5 w-5 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Selected property</p><h2 className="mt-1 truncate text-2xl font-semibold">{property.name}</h2><p className="mt-1 text-sm text-muted-foreground">{[property.location, property.price, property.configuration, property.status].filter(Boolean).join(" · ")}</p></div><p className="max-w-52 text-xs leading-5 text-muted-foreground">A fact snapshot is taken when the draft is created. Later inventory changes never silently change this creative.</p></div> : <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">Select a property to begin a grounded editorial draft.</div>}

          <div className="mt-7"><p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">2 · Format</p><h2 className="mt-1 text-xl font-semibold">Choose the Instagram surface</h2><div className="mt-4 grid gap-3 sm:grid-cols-2">{MARKETING_FORMATS.map(item => {
            const unavailableReason = formatAvailability(property, item)
            return <button type="button" key={item} onClick={() => chooseFormat(item)} disabled={Boolean(unavailableReason)} aria-pressed={format === item} title={unavailableReason ?? undefined} className={`rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-45 ${format === item ? "border-primary bg-primary text-primary-foreground shadow-sm" : "hover:border-primary/45 hover:bg-muted/35"}`}><div className="flex items-center justify-between gap-3"><span className="text-base font-semibold">{formatDetails[item].label}</span>{format === item && <Check className="h-4 w-4" />}</div><p className={`mt-2 text-sm leading-5 ${format === item ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{formatDetails[item].description}</p><p className={`mt-3 text-xs font-medium ${format === item ? "text-primary-foreground/75" : "text-muted-foreground"}`}>{formatDetails[item].output}</p></button>
          })}</div>{availabilityError && <p className="mt-3 text-xs text-amber-700">{availabilityError}</p>}</div>

          <div className="mt-7"><p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">3 · Objective</p><h2 className="mt-1 text-xl font-semibold">Set the editorial angle</h2><div className="mt-4 flex flex-wrap gap-2">{MARKETING_OBJECTIVES.map(item => <button type="button" key={item} onClick={() => { setObjective(item); setError(null) }} aria-pressed={objective === item} className={`rounded-full border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${objective === item ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/45 hover:bg-muted/35"}`}>{objectiveLabels[item]}</button>)}</div><p className="mt-3 text-xs leading-5 text-muted-foreground">The objective guides the editorial angle and copy. It never changes the selected renderer.</p></div>
        </section>
      </div>
    </section>

    <section aria-labelledby="studio-media-heading" className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">4 · Media</p><h2 id="studio-media-heading" className="mt-1 text-xl font-semibold">Curate the property story</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">The selected order is the persisted source order. The editor never substitutes a different property image once you curate it.</p></div><div className="rounded-xl bg-muted px-3 py-2 text-right text-xs text-muted-foreground"><span className="block font-semibold text-foreground">{selectedMediaIds.length} selected</span>{selectionBounds(format).minimum === selectionBounds(format).maximum ? "Exactly one required" : `${selectionBounds(format).minimum}–${selectionBounds(format).maximum} allowed`}</div></div>

      {selectedMedia.length > 0 && <div className="mt-5 rounded-2xl border bg-muted/25 p-3"><div className="mb-3 flex items-center justify-between"><p className="text-sm font-semibold">Selected sequence</p><p className="text-xs text-muted-foreground">{format === "carousel" ? "First image is the cover" : format === "reel" ? "First item is the opening scene" : "Selected property media"}</p></div><ol className="flex gap-3 overflow-x-auto pb-1">{selectedMedia.map((item, index) => <li key={item.id} className="w-32 shrink-0"><div className="relative overflow-hidden rounded-xl border bg-background"><div className="aspect-[4/3] bg-muted">{item.type === "image" ? <img src={item.url} alt={`Selected ${formatDetails[format].label} media ${index + 1}`} className="h-full w-full object-cover" /> : <video src={item.url} muted preload="metadata" className="h-full w-full object-cover" />}</div><span className="absolute left-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-xs font-semibold text-white">{index + 1}</span>{index === 0 && (format === "carousel" || format === "reel") && <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">{format === "carousel" ? "Cover" : "Opening"}</span>}<button type="button" onClick={() => setSelectedMediaIds(current => current.filter(id => id !== item.id))} className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-background/90 text-foreground shadow-sm" aria-label={`Remove selected media ${index + 1}`}><X className="h-3.5 w-3.5" /></button></div>{selectedMedia.length > 1 && <div className="mt-1 flex justify-between"><Button type="button" variant="ghost" size="icon-sm" onClick={() => moveMedia(item.id, -1)} disabled={index === 0} aria-label={`Move selected media ${index + 1} earlier`}><ArrowLeft className="h-3.5 w-3.5" /></Button><Button type="button" variant="ghost" size="icon-sm" onClick={() => moveMedia(item.id, 1)} disabled={index === selectedMedia.length - 1} aria-label={`Move selected media ${index + 1} later`}><ArrowRight className="h-3.5 w-3.5" /></Button></div>}</li>)}</ol></div>}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">{media.map(item => {
        const selectedIndex = selectedMediaIds.indexOf(item.id)
        const selected = selectedIndex >= 0
        const supported = allowedStudioMedia(format, item)
        return <button key={item.id} type="button" onClick={() => toggleMedia(item)} aria-pressed={selected} disabled={mediaLoading} className={`group relative overflow-hidden rounded-2xl border bg-muted text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected ? "border-primary ring-2 ring-primary/35" : supported ? "hover:border-primary/45" : "opacity-65"}`}><div className="aspect-[4/3] bg-muted">{item.type === "image" ? <img src={item.url} alt={`Property image${item.isCover ? ", property cover" : ""}`} className="h-full w-full object-cover" loading="lazy" decoding="async" /> : <video src={item.url} muted preload="metadata" className="h-full w-full object-cover" />}</div><span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-[10px] font-medium text-white">{item.type === "video" ? <Video className="h-3 w-3" /> : <ImageIcon className="h-3 w-3" />}{item.type === "video" ? "Video" : "Image"}</span>{selected ? <span className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground" aria-label={`Selection ${selectedIndex + 1}`}>{selectedIndex + 1}</span> : null}{item.isCover && <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">Property cover</span>}{!supported && <span className="absolute inset-x-2 bottom-2 rounded bg-background/90 px-2 py-1 text-center text-[10px] font-medium text-foreground">Video · available for Reels</span>}</button>
      })}</div>
      {mediaLoading && <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Loading property media…</div>}
      {mediaError && <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{mediaError}</p>}
      {!mediaLoading && !media.length && !mediaError && <p className="mt-5 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">This property has no accessible gallery media for the selected format.</p>}
      {nextOffset !== null && <div className="mt-5 text-center"><Button type="button" variant="outline" onClick={loadMoreMedia} disabled={mediaLoading}>Load more media{mediaTotal ? ` · ${media.length} of ${mediaTotal}` : ""}</Button></div>}
      {mediaSelectionError && <p className="mt-4 text-sm text-amber-700">{mediaSelectionError}</p>}
    </section>

    <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
      <section aria-labelledby="studio-creative-heading" className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7"><p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">5 · Creative</p><h2 id="studio-creative-heading" className="mt-1 text-xl font-semibold">A calm editorial assistant</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Luxury editorial is deliberately restrained, property-led, and fact-grounded. It will prepare {creationFields(format)} from the saved inventory snapshot.</p><div className="mt-5 border-l-2 border-primary/35 pl-4"><p className="text-sm font-medium">What AI will not do</p><p className="mt-1 text-xs leading-5 text-muted-foreground">It will not invent amenities, alter property photography, substitute your curated media, or publish anything. You can refine every generated field in the next workspace.</p></div></section>

      <section aria-labelledby="studio-brand-heading" className="rounded-3xl border bg-card p-5 shadow-sm sm:p-7"><p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">6 · Brand</p><h2 id="studio-brand-heading" className="mt-1 text-xl font-semibold">Optional, deterministic treatment</h2><div className="mt-4 flex items-center justify-between gap-4 rounded-2xl bg-muted/35 p-4"><div className="min-w-0"><p className="text-sm font-semibold">Use the active brand logo</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{activeBrandLogo ? `${activeBrandLogo.filename}${activeBrandLogo.width && activeBrandLogo.height ? ` · ${activeBrandLogo.width} × ${activeBrandLogo.height}` : ""}` : "Upload a private logo in Marketing Settings to enable this treatment."}</p></div>{activeBrandLogo?.previewUrl ? <img src={activeBrandLogo.previewUrl} alt="Active brand logo" className="max-h-10 max-w-24 object-contain" /> : null}<label className="flex shrink-0 items-center gap-2 text-sm font-medium"><input type="checkbox" checked={brandTreatment.enabled} disabled={!activeBrandLogo} onChange={event => setBrandTreatment(current => ({ ...current, enabled: event.target.checked }))} />On</label></div>{brandTreatment.enabled && <div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="grid gap-1 text-xs font-medium">Placement<select value={brandTreatment.placement} onChange={event => setBrandTreatment(current => ({ ...current, placement: event.target.value as BrandTreatment["placement"] }))} className="h-10 rounded-lg border bg-background px-2 text-sm">{supportsPlacement.map(placement => <option key={placement} value={placement}>{placement === "auto" ? "Auto (fixed)" : placement.replaceAll("_", " ")}</option>)}</select></label><label className="grid gap-1 text-xs font-medium">Scale<select value={brandTreatment.scale} onChange={event => setBrandTreatment(current => ({ ...current, scale: event.target.value as BrandTreatment["scale"] }))} className="h-10 rounded-lg border bg-background px-2 text-sm">{["small", "medium", "large"].map(scale => <option key={scale} value={scale}>{scale}</option>)}</select></label><label className="grid gap-1 text-xs font-medium">Opacity<input type="range" min="0.1" max="1" step="0.1" value={brandTreatment.opacity} onChange={event => setBrandTreatment(current => ({ ...current, opacity: Number(event.target.value) }))} aria-label="Logo opacity" /><span className="text-muted-foreground">{Math.round(brandTreatment.opacity * 100)}%</span></label></div>}<p className="mt-4 text-xs leading-5 text-muted-foreground">{format === "carousel" ? "Carousel treatment applies to the selected cover only; the remaining property images stay clean." : format === "feed_single" ? "The logo is deterministic only; editorial copy remains outside the property image." : format === "story" ? "The logo is placed deterministically within Story safe zones." : "Reel placement is applied deterministically by the existing renderer."}</p></section>
    </div>

    <section aria-labelledby="studio-preview-heading" className="overflow-hidden rounded-3xl border bg-card shadow-sm"><div className="grid lg:grid-cols-[0.8fr_1.2fr]"><div className="bg-zinc-950 p-4 sm:p-6"><div className="mb-3 flex items-center justify-between text-zinc-300"><p id="studio-preview-heading" className="text-xs font-semibold tracking-[0.14em] uppercase">7 · Preview</p><span className="text-[11px]">Pre-render source framing</span></div>{preview ? <div className={`relative mx-auto overflow-hidden rounded-2xl bg-black ${format === "story" || format === "reel" ? "aspect-[9/16] max-w-sm" : "aspect-[4/5] max-w-md"}`}>{preview.type === "image" ? <img src={preview.url} alt={`Selected ${formatDetails[format].label} preview`} className="h-full w-full object-cover" /> : <video src={preview.url} controls muted preload="metadata" className="h-full w-full object-cover" />}{format === "story" && <div aria-hidden className="pointer-events-none absolute inset-x-[9%] top-[11%] bottom-[16%] border border-dashed border-white/60" />}{format === "reel" && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-12"><p className="text-xs font-medium text-white">Opening scene · overlay copy is generated separately</p></div>}</div> : <div className={`grid place-items-center rounded-2xl border border-dashed border-zinc-700 text-center text-sm text-zinc-400 ${format === "story" || format === "reel" ? "aspect-[9/16] max-w-sm mx-auto" : "aspect-[4/5] max-w-md mx-auto"}`}><span><Eye className="mx-auto mb-2 h-5 w-5" />Choose property media to preview it here.</span></div>}{selectedMedia.length > 1 && <div className="mt-3 flex justify-center gap-2">{selectedMedia.map((item, index) => <button key={item.id} type="button" onClick={() => setActivePreviewIndex(index)} aria-label={`Preview selected media ${index + 1}`} aria-pressed={index === activePreviewIndex} className={`h-2.5 w-2.5 rounded-full ${index === activePreviewIndex ? "bg-white" : "bg-white/35"}`} />)}</div>}</div><div className="flex flex-col justify-between p-5 sm:p-7"><div><p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Before generation</p><h2 className="mt-1 text-2xl font-semibold">Everything is intentional.</h2><dl className="mt-6 grid gap-x-5 gap-y-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-muted-foreground">Property</dt><dd className="mt-1 font-medium">{property?.name ?? "Not selected"}</dd></div><div><dt className="text-xs text-muted-foreground">Format</dt><dd className="mt-1 font-medium">{formatDetails[format].label}</dd></div><div><dt className="text-xs text-muted-foreground">Objective</dt><dd className="mt-1 font-medium">{objectiveLabels[objective]}</dd></div><div><dt className="text-xs text-muted-foreground">Media</dt><dd className="mt-1 font-medium">{selectedMediaIds.length} selected · {selectedMediaIds.length > 1 ? "ordered" : "curated"}</dd></div><div><dt className="text-xs text-muted-foreground">Brand treatment</dt><dd className="mt-1 font-medium">{brandTreatment.enabled ? "Logo on" : "Logo off"}</dd></div><div><dt className="text-xs text-muted-foreground">Creative direction</dt><dd className="mt-1 font-medium">Luxury editorial</dd></div></dl></div><div className="mt-8"><Button size="lg" onClick={generate} disabled={isPending || !propertyId || Boolean(availabilityError) || Boolean(mediaSelectionError)} className="w-full rounded-xl"><Sparkles className="h-4 w-4" />{isPending ? <><Loader2 className="h-4 w-4 animate-spin" />{generationStage ?? "Preparing…"}</> : `Generate ${formatDetails[format].label} draft`}</Button><p className="mt-3 text-center text-xs leading-5 text-muted-foreground">Generation creates a reviewable draft only. Approval, scheduling, and publishing remain separate decisions.</p></div></div></div></section>
    {notice && <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="status">{notice}</p>}
    {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p>}
  </div>
}
