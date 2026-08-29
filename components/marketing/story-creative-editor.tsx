"use client"

/* eslint-disable @next/next/no-img-element */

import { Check, ImageIcon, Loader2, Sparkles } from "lucide-react"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { STORY_LAYOUT_STYLES, type MarketingAsset, type MarketingContent, type StoryCopy } from "@/lib/marketing/types"
import { StoryCompositionSchema } from "@/lib/marketing/schemas"
import { storyCopyEditorFeedback, STORY_COPY_GUIDANCE } from "@/lib/marketing/story-layout"
import { setStoryCreativeDirty } from "@/lib/marketing/story-editor-state"

const storyLayoutLabels: Record<(typeof STORY_LAYOUT_STYLES)[number], string> = {
  full_bleed_gradient: "Minimal",
  editorial_panel: "Editorial",
  lower_third: "Architectural",
  dark_panel: "Statement",
  light_panel: "Detail",
}

function initialCopy(content: MarketingContent): StoryCopy {
  const composition = StoryCompositionSchema.safeParse(content.composition)
  if (composition.success) return composition.data.storyCopy
  const creative = content.creative as { storyCopy?: Partial<StoryCopy> }
  return {
    headline: creative.storyCopy?.headline ?? content.headline ?? "",
    supportingLine: creative.storyCopy?.supportingLine ?? "",
    highlights: creative.storyCopy?.highlights ?? [],
    priceLine: creative.storyCopy?.priceLine ?? "",
    cta: creative.storyCopy?.cta ?? content.cta ?? "",
  }
}

function initialStoryState(content: MarketingContent, assets: MarketingAsset[], hasActiveLogo: boolean) {
  const composition = StoryCompositionSchema.safeParse(content.composition)
  const images = storySourceImageOptions(assets).map(option => option.asset)
  return {
    copy: initialCopy(content),
    sourceAssetId: composition.success ? composition.data.sourceAssetId : images[0]?.id ?? "",
    layoutStyle: composition.success ? composition.data.layoutStyle : "editorial_panel",
    logoEnabled: composition.success ? composition.data.logo.enabled : hasActiveLogo,
  }
}

/** Gallery-only property image options; IDs remain internal persistence keys. */
export function storySourceImageOptions(assets: MarketingAsset[]) {
  return assets
    .filter(asset => asset.kind === "original_reference" && asset.mediaType === "image")
    .map((asset, index) => ({ asset, label: `Image ${index + 1}` }))
}

function storySignature(input: {
  copy: StoryCopy
  sourceAssetId: string
  layoutStyle: string
  logoEnabled: boolean
}) {
  return JSON.stringify(input)
}

export function StoryCreativeEditor({ content, assets, hasActiveLogo }: { content: MarketingContent; assets: MarketingAsset[]; hasActiveLogo: boolean }) {
  const router = useRouter()
  const images = useMemo(() => storySourceImageOptions(assets).map(option => option.asset), [assets])
  const initial = useMemo(() => initialStoryState(content, assets, hasActiveLogo), [assets, content, hasActiveLogo])
  const [copy, setCopy] = useState(initial.copy)
  const [sourceAssetId, setSourceAssetId] = useState(initial.sourceAssetId)
  const [layoutStyle, setLayoutStyle] = useState(initial.layoutStyle)
  const [logoEnabled, setLogoEnabled] = useState(initial.logoEnabled)
  const [savedSignature, setSavedSignature] = useState(() => storySignature(initial))
  const [pickerOpen, setPickerOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const layoutFeedback = storyCopyEditorFeedback(copy)
  const currentSignature = storySignature({ copy, sourceAssetId, layoutStyle, logoEnabled })
  const dirty = currentSignature !== savedSignature
  const needsRender = !content.renderedUrl
  const selectedSource = images.find(asset => asset.id === sourceAssetId)

  useEffect(() => {
    setCopy(initial.copy)
    setSourceAssetId(initial.sourceAssetId)
    setLayoutStyle(initial.layoutStyle)
    setLogoEnabled(initial.logoEnabled)
    setSavedSignature(storySignature(initial))
    setPickerOpen(false)
  }, [content.id, content.updatedAt, initial])

  useEffect(() => {
    setStoryCreativeDirty(content.id, dirty)
    return () => setStoryCreativeDirty(content.id, false)
  }, [content.id, dirty])

  function applyCopy(next: StoryCopy) { setCopy({ ...next, highlights: next.highlights.slice(0, 3) }) }
  function save(nextSourceAssetId = sourceAssetId) {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/content/${content.id}/story`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceAssetId: nextSourceAssetId, storyCopy: copy, layoutStyle, logoEnabled }) })
      const data = await response.json().catch(() => ({})) as { error?: string; storyCopy?: StoryCopy; compacted?: boolean }
      if (response.ok && data.storyCopy) {
        applyCopy(data.storyCopy)
        setSourceAssetId(nextSourceAssetId)
        setSavedSignature(storySignature({ copy: data.storyCopy, sourceAssetId: nextSourceAssetId, layoutStyle, logoEnabled }))
        setPickerOpen(false)
      }
      setMessage(response.ok
        ? data.compacted
          ? "Story creative was compacted for the mobile-safe layout and queued for rendering. It must be re-approved after this material change."
          : "Story creative saved and rendering queued. It must be re-approved after this material change."
        : data.error ?? "Could not update Story creative.")
      if (response.ok) router.refresh()
    })
  }
  function improve() {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/content/${content.id}/story`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) })
      const data = await response.json().catch(() => ({})) as { error?: string; storyCopy?: StoryCopy; compacted?: boolean }
      if (response.ok && data.storyCopy) {
        applyCopy(data.storyCopy)
        setSavedSignature(storySignature({ copy: data.storyCopy, sourceAssetId, layoutStyle, logoEnabled }))
        setMessage(data.compacted ? "AI-improved Story creative was compacted and queued for rendering." : "AI-improved Story creative was saved and queued for rendering.")
        router.refresh()
      }
      else setMessage(data.error ?? "Could not improve Story copy.")
    })
  }
  function regenerate() {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/content/${content.id}/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: ["story_copy"] }) })
      const data = await response.json().catch(() => ({})) as { error?: string }
      setMessage(response.ok ? "Story copy regenerated and a fresh mobile-safe render was queued." : data.error ?? "Could not regenerate Story copy.")
      if (response.ok) router.refresh()
    })
  }

  return <section className="space-y-3 rounded-xl border p-4">
    <div><p className="text-sm font-semibold">Story creative</p><p className="mt-1 text-xs text-muted-foreground">These concise fields are rendered on the 9:16 Story. Feed captions and hashtags are not.</p></div>
    <div className="space-y-2">
      <p className="text-xs font-medium">Source property image</p>
      {selectedSource ? <div className="flex items-center gap-3 rounded-lg border p-2"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">{selectedSource.sourceUrl ? <img src={selectedSource.sourceUrl} alt="Current Story source image" className="h-full w-full object-cover" /> : <ImageIcon className="m-5 h-6 w-6 text-muted-foreground" />}</div><div className="min-w-0 flex-1"><p className="text-sm font-medium">Gallery image {images.findIndex(asset => asset.id === selectedSource.id) + 1}</p><p className="text-xs text-muted-foreground">This image will be used only to render a new Story derivative.</p></div><Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(open => !open)} disabled={pending}>Change image</Button></div> : <Button type="button" size="sm" variant="outline" onClick={() => setPickerOpen(true)} disabled={pending || !images.length}>Choose image</Button>}
      {pickerOpen && <div className="grid grid-cols-3 gap-2 rounded-lg border p-2 sm:grid-cols-4">{images.map((asset, index) => { const selected = asset.id === sourceAssetId; return <button key={asset.id} type="button" onClick={() => save(asset.id)} disabled={pending} className={`group relative overflow-hidden rounded-md border text-left ${selected ? "border-primary ring-2 ring-primary/40" : "hover:border-primary/60"}`} aria-pressed={selected}><div className="aspect-square bg-muted">{asset.sourceUrl ? <img src={asset.sourceUrl} alt={`Gallery image ${index + 1}`} className="h-full w-full object-cover" /> : <ImageIcon className="m-[38%] h-6 w-6 text-muted-foreground" />}</div><span className="block truncate px-2 py-1 text-[11px] font-medium">Image {index + 1}</span>{selected && <span className="absolute right-1 top-1 rounded-full bg-primary p-1 text-primary-foreground"><Check className="h-3 w-3" /></span>}</button> })}</div>}
    </div>
    <label className="grid gap-1 text-xs font-medium">Headline <span className="font-normal text-muted-foreground">Up to {STORY_COPY_GUIDANCE.headline.maximumLines} short lines</span><Input value={copy.headline} maxLength={STORY_COPY_GUIDANCE.headline.recommendedCharacters} onChange={event => setCopy({ ...copy, headline: event.target.value })} /></label>
    <label className="grid gap-1 text-xs font-medium">Supporting line <span className="font-normal text-muted-foreground">Up to {STORY_COPY_GUIDANCE.supportingLine.maximumLines} short lines</span><Input value={copy.supportingLine} maxLength={STORY_COPY_GUIDANCE.supportingLine.recommendedCharacters} onChange={event => setCopy({ ...copy, supportingLine: event.target.value })} /></label>
    <label className="grid gap-1 text-xs font-medium">Highlights (one per line, up to {STORY_COPY_GUIDANCE.highlights.maximumItems})<Textarea rows={3} maxLength={STORY_COPY_GUIDANCE.highlights.maximumItems * (STORY_COPY_GUIDANCE.highlights.recommendedCharactersPerItem + 1)} value={copy.highlights.join("\n")} onChange={event => setCopy({ ...copy, highlights: event.target.value.split("\n").map(item => item.trim().slice(0, STORY_COPY_GUIDANCE.highlights.recommendedCharactersPerItem)).filter(Boolean).slice(0, STORY_COPY_GUIDANCE.highlights.maximumItems) })} /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-medium">Price line (optional)<Input value={copy.priceLine} maxLength={STORY_COPY_GUIDANCE.priceLine.recommendedCharacters} onChange={event => setCopy({ ...copy, priceLine: event.target.value })} /></label><label className="grid gap-1 text-xs font-medium">CTA<Input value={copy.cta} maxLength={STORY_COPY_GUIDANCE.cta.recommendedCharacters} onChange={event => setCopy({ ...copy, cta: event.target.value })} /></label></div>
    <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-medium">Layout<select className="h-9 rounded-md border bg-background px-2 text-sm" value={layoutStyle} onChange={event => setLayoutStyle(event.target.value as typeof layoutStyle)}>{STORY_LAYOUT_STYLES.map(style => <option key={style} value={style}>{storyLayoutLabels[style]}</option>)}</select></label><label className="flex items-center gap-2 pt-5 text-xs font-medium"><input type="checkbox" checked={logoEnabled} disabled={!hasActiveLogo} onChange={event => setLogoEnabled(event.target.checked)} />Include active brand logo{!hasActiveLogo && " (no active logo)"}</label></div>
    <div className="flex flex-wrap gap-2"><Button type="button" size="sm" onClick={() => save()} disabled={pending || !sourceAssetId || (!dirty && !needsRender)}>{pending ? "Saving..." : dirty ? "Save Story creative" : needsRender ? "Render Story creative" : "Story creative saved"}</Button><Button type="button" size="sm" variant="outline" onClick={regenerate} disabled={pending}>Regenerate Story copy</Button></div>
    <div className="flex gap-2"><Input value={prompt} maxLength={600} placeholder="Improve with AI, e.g. Make this more minimal and editorial." onChange={event => setPrompt(event.target.value)} /><Button type="button" size="sm" variant="outline" onClick={improve} disabled={pending || prompt.trim().length < 3}><Sparkles className="h-4 w-4" />Improve</Button></div>
    {layoutFeedback && <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-950">{layoutFeedback}</p>}
    {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}{message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}
  </section>
}
