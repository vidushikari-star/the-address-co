"use client"

import { Loader2, VolumeX } from "lucide-react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import type { MarketingContent } from "@/lib/marketing/types"

function audioState(content: MarketingContent) {
  const audio = (content.composition as { audio?: { type?: unknown; label?: unknown } }).audio
  return {
    type: typeof audio?.type === "string" ? audio.type : "none",
    label: typeof audio?.label === "string" ? audio.label : "No audio selected",
  }
}

/**
 * There is no uploaded-audio library or Meta music-catalogue integration in
 * this CRM. Be explicit about that rather than presenting unavailable music as
 * selectable. A Reel can always be rendered silently.
 */
export function ReelAudioControls({ content }: { content: MarketingContent }) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const selected = audioState(content)
  const editable = ["draft", "changes_requested", "ready_for_review"].includes(content.status)

  function chooseNoAudio() {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch("/api/marketing/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: content.id,
          composition: {
            ...(content.composition as Record<string, unknown>),
            audio: { type: "none", label: "No audio selected" },
          },
        }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string }
      setMessage(response.ok ? "Reel will render without embedded audio." : data.error ?? "Could not update audio.")
      if (response.ok) router.refresh()
    })
  }

  return <section className="space-y-3 rounded-xl border p-4">
    <div><p className="text-sm font-semibold">Audio</p><p className="mt-1 text-xs text-muted-foreground">Selected: {selected.label}</p></div>
    <p className="text-xs text-muted-foreground">No uploaded audio tracks are available in this CRM. Instagram licensed or trending music cannot be attached through this integration.</p>
    {editable && <Button type="button" size="sm" variant="outline" onClick={chooseNoAudio} disabled={isPending || selected.type === "none"}>
      {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <VolumeX className="h-4 w-4" />}
      {selected.type === "none" ? "No audio selected" : "Remove audio"}
    </Button>}
    {message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}
  </section>
}
