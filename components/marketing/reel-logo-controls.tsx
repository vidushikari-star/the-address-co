"use client"

import { Loader2 } from "lucide-react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import type { MarketingBrandSettings, MarketingContent } from "@/lib/marketing/types"

export function ReelLogoControls({ content, settings, hasActiveLogo }: { content: MarketingContent; settings: MarketingBrandSettings; hasActiveLogo: boolean }) {
  const existing = (content.composition as { logo?: { placement?: string; scale?: string; opacity?: number } }).logo
  const [placement, setPlacement] = useState(existing?.placement ?? settings.defaultReelLogoPlacement)
  const [scale, setScale] = useState(existing?.scale ?? settings.defaultReelLogoScale)
  const [opacity, setOpacity] = useState(String(existing?.opacity ?? settings.defaultReelLogoOpacity))
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function save() {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/content/${content.id}/logo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ placement, scale, opacity: Number(opacity) }) })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) return setMessage(data.error ?? "Could not update the Reel logo treatment.")
      setMessage("Logo treatment saved for this editable Reel.")
      router.refresh()
    })
  }

  return <section className="rounded-xl border p-4"><div><p className="text-sm font-semibold">Reel logo</p><p className="mt-1 text-xs text-muted-foreground">Uses your private Brand Assets logo on a generated Reel derivative only. It never alters the CRM source media.</p></div><div className="mt-3 grid gap-3 sm:grid-cols-3"><label className="grid gap-1 text-xs font-medium">Placement<select value={placement} onChange={event => setPlacement(event.target.value)} className="h-9 rounded-md border bg-background px-2"><option value="none">No logo</option><option value="top_left">Top Left</option><option value="top_right">Top Right</option><option value="bottom_left">Bottom Left</option><option value="bottom_right">Bottom Right</option><option value="end_card_only">End Card Only</option></select></label><label className="grid gap-1 text-xs font-medium">Scale<select value={scale} onChange={event => setScale(event.target.value)} className="h-9 rounded-md border bg-background px-2"><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select></label><label className="grid gap-1 text-xs font-medium">Opacity<select value={opacity} onChange={event => setOpacity(event.target.value)} className="h-9 rounded-md border bg-background px-2"><option value="0.45">Subtle</option><option value="0.65">Balanced</option><option value="0.85">Prominent</option></select></label></div><div className="mt-3 flex flex-wrap items-center gap-3"><Button type="button" size="sm" onClick={save} disabled={isPending || (placement !== "none" && !hasActiveLogo)}>{isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}Save logo treatment</Button>{placement !== "none" && !hasActiveLogo && <span className="text-xs text-amber-700">Upload a private brand logo in Settings first.</span>}{message && <span className="text-xs text-muted-foreground" role="status">{message}</span>}</div></section>
}
