"use client"

import { useState, useTransition } from "react"
import { Loader2, Save } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { MarketingContent } from "@/lib/marketing/types"

export function MarketingContentEditor({ content }: { content: MarketingContent }) {
  const router = useRouter()
  const [caption, setCaption] = useState(content.caption ?? "")
  const [headline, setHeadline] = useState(content.headline ?? "")
  const [hook, setHook] = useState(content.hook ?? "")
  const [cta, setCta] = useState(content.cta ?? "")
  const [hashtags, setHashtags] = useState(content.hashtags.join(" "))
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function save() {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch("/api/marketing/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: content.id,
          caption,
          headline,
          hook,
          cta,
          hashtags: hashtags.split(/[\s,]+/).map(tag => tag.trim()).filter(Boolean),
        }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string }
      setMessage(response.ok ? "Saved. This draft still needs explicit approval." : data.error ?? "Could not save these edits.")
      if (response.ok) router.refresh()
    })
  }

  return <div className="space-y-3 rounded-xl border p-4">
    <p className="text-sm font-semibold">Edit review copy</p>
    <label className="grid gap-1 text-xs font-medium">Headline<Input value={headline} onChange={event => setHeadline(event.target.value)} maxLength={160} /></label>
    <label className="grid gap-1 text-xs font-medium">Hook<Input value={hook} onChange={event => setHook(event.target.value)} maxLength={160} /></label>
    <label className="grid gap-1 text-xs font-medium">Caption<Textarea value={caption} onChange={event => setCaption(event.target.value)} rows={6} maxLength={2200} /></label>
    <label className="grid gap-1 text-xs font-medium">Hashtags<Input value={hashtags} onChange={event => setHashtags(event.target.value)} placeholder="#goarealestate #luxuryhomes" /></label>
    <label className="grid gap-1 text-xs font-medium">CTA<Input value={cta} onChange={event => setCta(event.target.value)} maxLength={240} /></label>
    <Button type="button" size="sm" onClick={save} disabled={isPending}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save copy</Button>
    {message && <p className="text-xs text-muted-foreground">{message}</p>}
  </div>
}
