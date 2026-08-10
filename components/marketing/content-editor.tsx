"use client"

import { useEffect, useState, useTransition } from "react"
import { Loader2, RefreshCw, Save, Sparkles, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { MarketingContent } from "@/lib/marketing/types"

type CopyField = "headline" | "hook" | "caption" | "cta" | "hashtags"

const targetActions: Array<{ field: CopyField; label: string }> = [
  { field: "headline", label: "Regenerate headline" },
  { field: "hook", label: "Regenerate hook" },
  { field: "caption", label: "Regenerate caption" },
  { field: "cta", label: "Regenerate CTA" },
  { field: "hashtags", label: "Regenerate hashtags" },
]

export function MarketingContentEditor({ content }: { content: MarketingContent }) {
  const router = useRouter()
  const [headline, setHeadline] = useState(content.headline ?? "")
  const [hook, setHook] = useState(content.hook ?? "")
  const [caption, setCaption] = useState(content.caption ?? "")
  const [cta, setCta] = useState(content.cta ?? "")
  const [hashtags, setHashtags] = useState(content.hashtags.join(" "))
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const hasGeneratedCopy = Boolean(
    content.headline?.trim() &&
    content.hook?.trim() &&
    content.caption?.trim() &&
    content.cta?.trim() &&
    content.hashtags.length
  )

  function applyContent(next: MarketingContent) {
    setHeadline(next.headline ?? "")
    setHook(next.hook ?? "")
    setCaption(next.caption ?? "")
    setCta(next.cta ?? "")
    setHashtags(next.hashtags.join(" "))
  }

  useEffect(() => {
    setHeadline(content.headline ?? "")
    setHook(content.hook ?? "")
    setCaption(content.caption ?? "")
    setCta(content.cta ?? "")
    setHashtags(content.hashtags.join(" "))
  }, [content])

  function generate(fields?: CopyField[]) {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/content/${content.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields ? { fields } : {}),
      })
      const data = await response.json().catch(() => ({})) as { content?: MarketingContent; error?: string }
      if (!response.ok || !data.content) {
        setMessage(data.error ?? "AI generation could not be completed.")
        return
      }
      applyContent(data.content)
      setMessage(fields?.length ? "Updated the selected field with AI." : "AI copy generated. Review and edit it before approval.")
      router.refresh()
    })
  }

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
      setMessage(response.ok ? "Saved. This copy still needs explicit approval." : data.error ?? "Could not save these edits.")
      if (response.ok) router.refresh()
    })
  }

  function deleteDraft() {
    if (!window.confirm("Delete this draft? Its generated media and copy will be removed. Original property media will remain untouched.")) return
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/content/${content.id}`, { method: "DELETE" })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) {
        setMessage(data.error ?? "The draft could not be deleted.")
        return
      }
      router.push("/marketing/content")
      router.refresh()
    })
  }

  return <div className="space-y-4 rounded-xl border p-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-sm font-semibold">Review copy</p><p className="mt-1 text-xs text-muted-foreground">AI uses only the property facts and current Marketing brand settings.</p></div>
      <Button type="button" size="sm" onClick={() => generate()} disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : hasGeneratedCopy ? <RefreshCw className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        {hasGeneratedCopy ? "Regenerate with AI" : "Generate with AI"}
      </Button>
    </div>
    <label className="grid gap-1 text-xs font-medium">Headline<Input value={headline} onChange={event => setHeadline(event.target.value)} maxLength={160} placeholder="Generated headline" /></label>
    <label className="grid gap-1 text-xs font-medium">Hook<Input value={hook} onChange={event => setHook(event.target.value)} maxLength={160} placeholder="Generated opening hook" /></label>
    <label className="grid gap-1 text-xs font-medium">Caption<Textarea value={caption} onChange={event => setCaption(event.target.value)} rows={6} maxLength={2200} placeholder="Generated Instagram caption" /></label>
    <label className="grid gap-1 text-xs font-medium">Hashtags<Input value={hashtags} onChange={event => setHashtags(event.target.value)} placeholder="#goarealestate #luxuryhomes" /></label>
    <label className="grid gap-1 text-xs font-medium">CTA<Input value={cta} onChange={event => setCta(event.target.value)} maxLength={240} placeholder="Generated call to action" /></label>
    <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={save} disabled={isPending}><Save className="h-4 w-4" />Save edits</Button>{hasGeneratedCopy && targetActions.map(action => <Button key={action.field} type="button" size="sm" variant="ghost" onClick={() => generate([action.field])} disabled={isPending}>{action.label}</Button>)}{content.status === "draft" && <Button type="button" size="sm" variant="destructive" onClick={deleteDraft} disabled={isPending}><Trash2 className="h-4 w-4" />Delete draft</Button>}</div>
    {message && <p className="rounded-lg bg-muted p-3 text-xs text-muted-foreground" role="status">{message}</p>}
  </div>
}
