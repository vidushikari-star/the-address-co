"use client"

import { useState, useTransition } from "react"
import { CalendarClock, Loader2, Send } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function MarketingPublishingActions({ contentId, canPublishNow }: { contentId: string; canPublishNow: boolean }) {
  const router = useRouter()
  const [scheduledFor, setScheduledFor] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function schedule() {
    if (!scheduledFor) return setMessage("Choose a future date and time.")
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/schedule/${contentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduledFor: new Date(scheduledFor).toISOString(), timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata" }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string }
      setMessage(response.ok ? "Scheduled. It will still publish only through the protected worker." : data.error ?? "Could not schedule this content.")
      if (response.ok) router.refresh()
    })
  }

  function publishNow() {
    if (!window.confirm("Queue this approved content for publishing now?")) return
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/publish/${contentId}`, { method: "POST" })
      const data = await response.json().catch(() => ({})) as { error?: string }
      setMessage(response.ok ? "Publishing has been queued for the protected worker." : data.error ?? "Could not queue publishing.")
      if (response.ok) router.refresh()
    })
  }

  return <div className="space-y-3 rounded-xl border p-4">
    <p className="text-sm font-semibold">Publishing controls</p>
    <label className="grid gap-1 text-xs font-medium">Schedule in your local timezone<Input type="datetime-local" value={scheduledFor} onChange={event => setScheduledFor(event.target.value)} /></label>
    <div className="flex flex-wrap gap-2"><Button type="button" size="sm" onClick={schedule} disabled={isPending}><CalendarClock className="h-4 w-4" />Schedule post</Button>{canPublishNow && <Button type="button" size="sm" variant="outline" onClick={publishNow} disabled={isPending}><Send className="h-4 w-4" />Publish now</Button>}{isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}</div>
    <p className="text-xs text-muted-foreground">{canPublishNow ? "Publish now is queued for the protected worker, never sent from this browser." : "Direct publishing is disabled by feature flag; scheduling remains available."}</p>
    {message && <p className="text-xs text-muted-foreground">{message}</p>}
  </div>
}
