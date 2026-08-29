"use client"
/* eslint-disable @next/next/no-img-element */

import { ArrowDown, ArrowUp, Loader2, Plus, Trash2, Video } from "lucide-react"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ReelCompositionSchema } from "@/lib/marketing/schemas"
import type { MarketingAsset, MarketingContent, ReelComposition } from "@/lib/marketing/types"

type Scene = ReelComposition["scenes"][number]

function sourceAssets(assets: MarketingAsset[]) {
  return assets.filter(asset => asset.kind === "original_reference" && (asset.mediaType === "image" || asset.mediaType === "video") && Boolean(asset.sourceUrl || asset.signedUrl))
}

function visualScenes(content: MarketingContent) {
  const parsed = ReelCompositionSchema.safeParse(content.composition)
  return parsed.success ? parsed.data.scenes.filter(scene => scene.overlay?.type !== "end_card") : []
}

function resetSceneStarts(scenes: Scene[]) {
  let start = 0
  return scenes.map(scene => {
    const duration = Math.max(1.5, Math.min(12, Number(scene.duration.toFixed(2))))
    const next = { ...scene, start, duration }
    start += duration
    return next
  })
}

/** An intentionally bounded first storyboard editor—not a video timeline. */
export function ReelStoryboardEditor({ content, assets }: { content: MarketingContent; assets: MarketingAsset[] }) {
  const router = useRouter()
  const available = useMemo(() => sourceAssets(assets), [assets])
  const [scenes, setScenes] = useState<Scene[]>(() => resetSceneStarts(visualScenes(content)))
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setScenes(resetSceneStarts(visualScenes(content)))
    setMessage(null)
  }, [content])

  function updateScene(index: number, change: Partial<Scene>) {
    setScenes(current => resetSceneStarts(current.map((scene, sceneIndex) => sceneIndex === index ? { ...scene, ...change } : scene)))
  }

  function updateOverlay(index: number, text: string) {
    setScenes(current => current.map((scene, sceneIndex) => sceneIndex === index ? {
      ...scene,
      overlay: text ? { ...(scene.overlay ?? { position: sceneIndex === 0 ? "top_left" : "lower_left", type: sceneIndex === 0 ? "hook" : "key_fact" }), text } : undefined,
    } : scene))
  }

  function move(index: number, direction: -1 | 1) {
    setScenes(current => {
      const destination = index + direction
      if (destination < 0 || destination >= current.length) return current
      const next = [...current]
      ;[next[index], next[destination]] = [next[destination], next[index]]
      return resetSceneStarts(next)
    })
  }

  function addScene(assetId: string) {
    if (!assetId || scenes.some(scene => scene.assetId === assetId) || scenes.length >= 10) return
    const asset = available.find(item => item.id === assetId)
    if (!asset) return
    setScenes(current => resetSceneStarts([...current, {
      assetId,
      start: 0,
      duration: 3,
      crop: "cover",
      motion: "slow_zoom",
      overlay: { text: "", position: "lower_left", type: "key_fact" },
      transitionOut: "cross_dissolve",
    }]))
  }

  function save() {
    if (!scenes.length) return setMessage("Keep at least one selected property scene in the Reel.")
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/content/${content.id}/reel/storyboard`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenes }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string; createdDraft?: boolean; version?: { versionNumber?: number } }
      setMessage(response.ok
        ? `Storyboard saved${data.createdDraft ? ` as Version ${data.version?.versionNumber ?? "new"}` : ""}. Review and approve the draft before re-rendering.`
        : data.error ?? "The Reel storyboard could not be saved.")
      if (response.ok) router.refresh()
    })
  }

  const unusedAssets = available.filter(asset => !scenes.some(scene => scene.assetId === asset.id))
  if (!scenes.length && !available.length) return null

  return <section className="space-y-4 rounded-xl border p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-semibold">Reel storyboard</p><p className="mt-1 text-xs leading-5 text-muted-foreground">Order the real property scenes, set a safe duration, and refine concise deterministic overlay copy. The opening scene is the review cover; no synthetic cover is created.</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{scenes.length} scenes · {Math.round(scenes.reduce((total, scene) => total + scene.duration, 0))}s</span></div>
    <ol className="space-y-3">{scenes.map((scene, index) => {
      const asset = available.find(item => item.id === scene.assetId)
      return <li key={`${scene.assetId}-${index}`} className="grid gap-3 rounded-xl border bg-muted/20 p-3 sm:grid-cols-[8rem_1fr]">
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">{asset?.mediaType === "image" ? <img src={asset.sourceUrl ?? asset.signedUrl ?? ""} alt={`Reel scene ${index + 1}`} className="h-full w-full object-cover" /> : asset ? <video src={asset.sourceUrl ?? asset.signedUrl ?? ""} muted preload="metadata" className="h-full w-full object-cover" /> : null}{asset?.mediaType === "video" && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white"><Video className="h-3 w-3" />Video</span>}<span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">{index === 0 ? "Opening scene" : `Scene ${index + 1}`}</span></div>
        <div className="min-w-0"><div className="flex flex-wrap items-center justify-between gap-2"><label className="text-xs font-medium">Property media<select value={scene.assetId} onChange={event => updateScene(index, { assetId: event.target.value })} disabled={isPending} className="ml-2 h-8 max-w-48 rounded-md border bg-background px-2 text-xs">{available.map((item, optionIndex) => <option key={item.id} value={item.id}>{item.mediaType === "video" ? "Video" : "Image"} {optionIndex + 1}</option>)}</select></label><div className="flex gap-1"><Button type="button" size="icon-sm" variant="ghost" onClick={() => move(index, -1)} disabled={isPending || index === 0} aria-label={`Move Reel scene ${index + 1} earlier`}><ArrowUp className="h-3.5 w-3.5" /></Button><Button type="button" size="icon-sm" variant="ghost" onClick={() => move(index, 1)} disabled={isPending || index === scenes.length - 1} aria-label={`Move Reel scene ${index + 1} later`}><ArrowDown className="h-3.5 w-3.5" /></Button><Button type="button" size="icon-sm" variant="ghost" onClick={() => setScenes(current => resetSceneStarts(current.filter((_, sceneIndex) => sceneIndex !== index)))} disabled={isPending || scenes.length === 1} aria-label={`Remove Reel scene ${index + 1}`}><Trash2 className="h-3.5 w-3.5" /></Button></div></div><div className="mt-3 grid gap-3 sm:grid-cols-[7rem_1fr]"><label className="grid gap-1 text-xs font-medium">Duration<Input type="number" min="1.5" max="12" step="0.5" value={scene.duration} onChange={event => updateScene(index, { duration: Number(event.target.value) || 1.5 })} disabled={isPending} /></label><label className="grid gap-1 text-xs font-medium">Overlay copy<Input value={scene.overlay?.text ?? ""} maxLength={120} onChange={event => updateOverlay(index, event.target.value)} placeholder={index === 0 ? "Opening hook" : "Concise property detail"} disabled={isPending} /></label></div></div>
      </li>
    })}</ol>
    {unusedAssets.length > 0 && scenes.length < 10 && <label className="flex flex-wrap items-center gap-2 text-xs font-medium">Add property media<select defaultValue="" onChange={event => { addScene(event.target.value); event.currentTarget.value = "" }} disabled={isPending} className="h-9 rounded-md border bg-background px-2 text-sm"><option value="" disabled>Choose an unused image or video</option>{unusedAssets.map((asset, index) => <option key={asset.id} value={asset.id}>{asset.mediaType === "video" ? "Video" : "Image"} {index + 1}</option>)}</select><Plus className="h-3.5 w-3.5 text-muted-foreground" /></label>}
    <div className="flex flex-wrap items-center gap-2"><Button type="button" size="sm" onClick={save} disabled={isPending || !scenes.length}>{isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Save storyboard</Button>{message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}</div>
  </section>
}
