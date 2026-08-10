"use client"
/* eslint-disable @next/next/no-img-element */

import { useState, useTransition } from "react"
import { CalendarDays, Check, Loader2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Property = { id: string; name: string; location: string; coverImage?: string }

export function CampaignPlanner({ properties }: { properties: Property[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<string[]>([])
  const [title, setTitle] = useState("North Goa inventory campaign")
  const [durationDays, setDurationDays] = useState(14)
  const [frequency, setFrequency] = useState(3)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function toggle(id: string) { setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]) }
  function createPlan() {
    setError(null)
    startTransition(async () => {
      const startsAt = new Date(Date.now() + 86_400_000).toISOString()
      const response = await fetch("/api/marketing/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyIds: selected, title, durationDays, postingFrequency: frequency, startsAt, creativeDirection: "surprise_me", objective: "Balanced Marketing Campaign" }) })
      const payload = await response.json().catch(() => ({})) as { campaign?: { id: string }; error?: string }
      if (!response.ok || !payload.campaign) return setError(payload.error || "Campaign plan could not be created.")
      router.push(`/marketing/campaigns?selected=${payload.campaign.id}`)
      router.refresh()
    })
  }

  return <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]"><section className="rounded-2xl border bg-card p-5"><p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Inventory selection</p><h2 className="mt-1 text-lg font-semibold">Build from multiple properties</h2><div className="mt-5 grid max-h-[32rem] gap-2 overflow-auto pr-1">{properties.map(property => <button type="button" key={property.id} onClick={() => toggle(property.id)} className={`flex items-center gap-3 rounded-xl border p-3 text-left ${selected.includes(property.id) ? "border-primary bg-primary/5" : "hover:bg-muted"}`}><div className="h-12 w-14 overflow-hidden rounded-lg bg-muted">{property.coverImage && <img src={property.coverImage} alt="" className="h-full w-full object-cover" />}</div><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{property.name}</span><span className="block truncate text-xs text-muted-foreground">{property.location}</span></span>{selected.includes(property.id) && <Check className="h-4 w-4 text-primary" />}</button>)}</div></section><section className="rounded-2xl border bg-card p-5"><p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Campaign brief</p><h2 className="mt-1 text-lg font-semibold">Plan before generation</h2><label className="mt-5 grid gap-1.5 text-sm font-medium">Campaign name<Input value={title} onChange={event => setTitle(event.target.value)} /></label><div className="mt-4 grid grid-cols-2 gap-4"><label className="grid gap-1.5 text-sm font-medium">Duration<select value={durationDays} onChange={event => setDurationDays(Number(event.target.value))} className="h-9 rounded-lg border bg-background px-2.5 text-sm"><option value={7}>7 days</option><option value={14}>14 days</option><option value={30}>30 days</option></select></label><label className="grid gap-1.5 text-sm font-medium">Posts per week<select value={frequency} onChange={event => setFrequency(Number(event.target.value))} className="h-9 rounded-lg border bg-background px-2.5 text-sm"><option value={2}>2 posts</option><option value={3}>3 posts</option><option value={5}>5 posts</option></select></label></div><div className="mt-5 rounded-xl bg-muted/70 p-4 text-sm"><div className="flex items-center gap-2 font-semibold"><CalendarDays className="h-4 w-4 text-primary" />AI-recommended mix</div><p className="mt-2 leading-6 text-muted-foreground">The planner rotates selected properties and formats before any AI calls or rendering. You approve the plan separately before generation begins.</p></div>{error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}<Button onClick={createPlan} disabled={isPending || !selected.length} className="mt-6 w-full"><Sparkles className="h-4 w-4" />{isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Creating plan…</> : `Create plan for ${selected.length} properties`}</Button></section></div>
}
