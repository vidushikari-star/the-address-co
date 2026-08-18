"use client"

import { Loader2, Sparkles } from "lucide-react"
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { STORY_LAYOUT_STYLES, type MarketingAsset, type MarketingContent, type StoryCopy } from "@/lib/marketing/types"
import { StoryCompositionSchema } from "@/lib/marketing/schemas"

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

export function StoryCreativeEditor({ content, assets, hasActiveLogo }: { content: MarketingContent; assets: MarketingAsset[]; hasActiveLogo: boolean }) {
  const router = useRouter()
  const existing = StoryCompositionSchema.safeParse(content.composition)
  const images = useMemo(() => assets.filter(asset => asset.kind === "original_reference" && asset.mediaType === "image"), [assets])
  const [copy, setCopy] = useState(() => initialCopy(content))
  const [sourceAssetId, setSourceAssetId] = useState(existing.success ? existing.data.sourceAssetId : images[0]?.id ?? "")
  const [layoutStyle, setLayoutStyle] = useState(existing.success ? existing.data.layoutStyle : "editorial_panel")
  const [logoEnabled, setLogoEnabled] = useState(existing.success ? existing.data.logo.enabled : hasActiveLogo)
  const [prompt, setPrompt] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function applyCopy(next: StoryCopy) { setCopy({ ...next, highlights: next.highlights.slice(0, 3) }) }
  function save() {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/content/${content.id}/story`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceAssetId, storyCopy: copy, layoutStyle, logoEnabled }) })
      const data = await response.json().catch(() => ({})) as { error?: string }
      setMessage(response.ok ? "Story creative saved and rendering queued. It must be re-approved after this material change." : data.error ?? "Could not update Story creative.")
      if (response.ok) router.refresh()
    })
  }
  function improve() {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/content/${content.id}/story`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt }) })
      const data = await response.json().catch(() => ({})) as { error?: string; storyCopy?: StoryCopy }
      if (response.ok && data.storyCopy) { applyCopy(data.storyCopy); setMessage("AI draft applied locally. Save it to render a new Story creative.") }
      else setMessage(data.error ?? "Could not improve Story copy.")
    })
  }

  return <section className="space-y-3 rounded-xl border p-4">
    <div><p className="text-sm font-semibold">Story creative</p><p className="mt-1 text-xs text-muted-foreground">These concise fields are rendered on the 9:16 Story. Feed captions and hashtags are not.</p></div>
    <label className="grid gap-1 text-xs font-medium">Source property image<select className="h-9 rounded-md border bg-background px-2 text-sm" value={sourceAssetId} onChange={event => setSourceAssetId(event.target.value)}>{images.map(asset => <option key={asset.id} value={asset.id}>{asset.propertyImageId ? `Property image ${asset.propertyImageId.slice(0, 8)}` : `Image ${asset.id.slice(0, 8)}`}</option>)}</select></label>
    <label className="grid gap-1 text-xs font-medium">Headline<Input value={copy.headline} maxLength={72} onChange={event => setCopy({ ...copy, headline: event.target.value })} /></label>
    <label className="grid gap-1 text-xs font-medium">Supporting line<Input value={copy.supportingLine} maxLength={150} onChange={event => setCopy({ ...copy, supportingLine: event.target.value })} /></label>
    <label className="grid gap-1 text-xs font-medium">Highlights (one per line)<Textarea rows={3} value={copy.highlights.join("\n")} onChange={event => setCopy({ ...copy, highlights: event.target.value.split("\n").map(item => item.trim()).filter(Boolean).slice(0, 3) })} /></label>
    <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-medium">Price line (optional)<Input value={copy.priceLine} maxLength={64} onChange={event => setCopy({ ...copy, priceLine: event.target.value })} /></label><label className="grid gap-1 text-xs font-medium">CTA<Input value={copy.cta} maxLength={60} onChange={event => setCopy({ ...copy, cta: event.target.value })} /></label></div>
    <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-xs font-medium">Layout<select className="h-9 rounded-md border bg-background px-2 text-sm" value={layoutStyle} onChange={event => setLayoutStyle(event.target.value as typeof layoutStyle)}>{STORY_LAYOUT_STYLES.map(style => <option key={style} value={style}>{style.replaceAll("_", " ")}</option>)}</select></label><label className="flex items-center gap-2 pt-5 text-xs font-medium"><input type="checkbox" checked={logoEnabled} disabled={!hasActiveLogo} onChange={event => setLogoEnabled(event.target.checked)} />Include active brand logo{!hasActiveLogo && " (no active logo)"}</label></div>
    <div className="flex flex-wrap gap-2"><Button type="button" size="sm" onClick={save} disabled={pending || !sourceAssetId}>Save Story creative</Button></div>
    <div className="flex gap-2"><Input value={prompt} maxLength={600} placeholder="Improve with AI, e.g. Make this more minimal and editorial." onChange={event => setPrompt(event.target.value)} /><Button type="button" size="sm" variant="outline" onClick={improve} disabled={pending || prompt.trim().length < 3}><Sparkles className="h-4 w-4" />Improve</Button></div>
    {pending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}{message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}
  </section>
}
