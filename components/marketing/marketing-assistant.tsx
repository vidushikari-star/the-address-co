"use client"

import { useState, useTransition } from "react"
import { Loader2, Send } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type Property = { id: string; name: string }

export function MarketingAssistant({ properties }: { properties: Property[] }) {
  const router = useRouter()
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "")
  const [prompt, setPrompt] = useState("Create a cinematic Reel for this property.")
  const [reply, setReply] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function submit() {
    startTransition(async () => {
      const response = await fetch("/api/marketing/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ propertyId, prompt }) })
      const data = await response.json().catch(() => ({})) as { reply?: string; error?: string }
      setReply(data.reply || data.error || "The assistant could not create a draft.")
      if (response.ok) router.refresh()
    })
  }

  return <section className="rounded-2xl border bg-card p-5"><div className="flex items-center gap-2"><span className="rounded-lg bg-primary p-2 text-primary-foreground"><Send className="h-4 w-4" /></span><div><h2 className="font-semibold">Marketing assistant</h2><p className="text-sm text-muted-foreground">Creates a draft from a conversation — never approves or publishes.</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-[0.42fr_0.58fr]"><select value={propertyId} onChange={event => setPropertyId(event.target.value)} className="h-9 rounded-lg border bg-background px-2.5 text-sm">{properties.map(property => <option key={property.id} value={property.id}>{property.name}</option>)}</select><Input value={prompt} onChange={event => setPrompt(event.target.value)} /></div><Button variant="outline" onClick={submit} disabled={isPending || !propertyId} className="mt-3">{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Create draft</Button>{reply && <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-muted-foreground">{reply}</p>}</section>
}
