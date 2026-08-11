"use client"
/* eslint-disable @next/next/no-img-element */

import { useMemo, useRef, useState, useTransition } from "react"
import { Check, Loader2, Search, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CONTENT_TYPE_LABELS, CREATIVE_DIRECTIONS, MARKETING_CONTENT_TYPES, type CreativeDirection, type MarketingContentType } from "@/lib/marketing/types"

type PropertyOption = {
  id: string
  name: string
  location: string
  price?: string
  coverImage?: string
  status?: string
}

const directions: Record<CreativeDirection, string> = {
  luxury_editorial: "Luxury editorial",
  cinematic: "Cinematic",
  minimal: "Minimal",
  investment_focused: "Investment focused",
  lifestyle: "Lifestyle",
  architecture_focused: "Architecture focused",
  tropical_goa: "Tropical Goa",
  high_energy_reel: "High energy Reel",
  elegant_slow_reel: "Elegant slow Reel",
  surprise_me: "Surprise me",
}

export function CreateContentStudio({ properties, initialPropertyId }: { properties: PropertyOption[]; initialPropertyId?: string }) {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const [propertyId, setPropertyId] = useState(initialPropertyId ?? properties[0]?.id ?? "")
  const [contentType, setContentType] = useState<MarketingContentType>("reel")
  const [direction, setDirection] = useState<CreativeDirection>("surprise_me")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  // Keep one request key while this studio instance is open. A browser retry
  // after an uncertain response then returns the original draft instead of
  // creating a second Marketing item.
  const createIdempotencyKey = useRef(crypto.randomUUID())
  const property = properties.find(item => item.id === propertyId)
  const matchingProperties = useMemo(() => properties.filter(item => [item.name, item.location, item.status].join(" ").toLocaleLowerCase().includes(query.toLocaleLowerCase())), [properties, query])

  function generate() {
    if (!propertyId) return setError("Select an inventory property first.")
    setError(null)
    startTransition(async () => {
      const response = await fetch("/api/marketing/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId, contentType, creativeDirection: direction, idempotencyKey: createIdempotencyKey.current }),
      })
      const payload = await response.json().catch(() => ({})) as { content?: { id: string }; error?: string }
      if (!response.ok || !payload.content) {
        setError(payload.error || "The marketing content item could not be created.")
        return
      }
      const generated = await fetch(`/api/marketing/content/${payload.content.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const generation = await generated.json().catch(() => ({})) as { error?: string }
      if (!generated.ok) {
        router.push(`/marketing/content?selected=${payload.content.id}&generationError=${encodeURIComponent(generation.error || "AI copy generation failed.")}`)
        router.refresh()
        return
      }
      router.push(`/marketing/content?selected=${payload.content.id}`)
      router.refresh()
    })
  }

  return <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-center justify-between"><div><p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Step 1</p><h2 className="mt-1 text-lg font-semibold">Choose inventory</h2></div><span className="text-sm text-muted-foreground">{properties.length} properties</span></div>
      <div className="relative mt-5"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search properties or locations" className="h-10 pl-9" /></div>
      <div className="mt-4 max-h-[30rem] space-y-2 overflow-auto pr-1">
        {matchingProperties.map(item => <button type="button" onClick={() => setPropertyId(item.id)} key={item.id} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${item.id === propertyId ? "border-primary bg-primary/5" : "hover:bg-muted/60"}`}>
          <div className="h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">{item.coverImage ? <img src={item.coverImage} alt="" className="h-full w-full object-cover" /> : null}</div>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.name}</span><span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.location}{item.price ? ` · ${item.price}` : ""}</span></span>
          {item.id === propertyId && <Check className="h-4 w-4 shrink-0 text-primary" />}
        </button>)}
      </div>
    </section>
    <section className="rounded-2xl border bg-card p-5 sm:p-6">
      <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Step 2</p><h2 className="mt-1 text-lg font-semibold">Set the creative brief</h2>
      <div className="mt-5"><p className="text-sm font-medium">Content type</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{MARKETING_CONTENT_TYPES.map(type => <button type="button" key={type} onClick={() => setContentType(type)} className={`rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${contentType === type ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted"}`}>{CONTENT_TYPE_LABELS[type]}</button>)}</div></div>
      <div className="mt-6"><p className="text-sm font-medium">Creative direction</p><div className="mt-3 flex flex-wrap gap-2">{CREATIVE_DIRECTIONS.map(item => <button type="button" key={item} onClick={() => setDirection(item)} className={`rounded-full border px-3 py-1.5 text-sm transition ${direction === item ? "border-primary bg-primary/10 text-primary" : "hover:bg-muted"}`}>{directions[item]}</button>)}</div></div>
      <div className="mt-7 rounded-xl bg-muted/60 p-4"><p className="text-sm font-semibold">{property?.name || "Select a property"}</p><p className="mt-1 text-sm text-muted-foreground">The studio snapshots this property’s facts and original media. It will not change the original inventory record.</p></div>
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <Button size="lg" onClick={generate} disabled={isPending || !propertyId} className="mt-6 w-full"><Sparkles className="h-4 w-4" />{isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Generating copy…</> : `Create ${CONTENT_TYPE_LABELS[contentType]}`}</Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">AI creates a draft only. Approval and publishing always remain with you.</p>
    </section>
  </div>
}
