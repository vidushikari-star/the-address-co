"use client"

import { Loader2, Music2, Play, VolumeX } from "lucide-react"
import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { MarketingAudioTrack, MarketingContent, MarketingReelVersion, ReelComposition } from "@/lib/marketing/types"

function formatDuration(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds))
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`
}

function AudioPreviewButton({ url, label }: { url?: string | null; label: string }) {
  const audio = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)

  if (!url) return null
  return <><audio ref={audio} src={url} preload="none" onEnded={() => setPlaying(false)} />
    <Button type="button" size="sm" variant="ghost" onClick={() => {
      if (!audio.current) return
      if (audio.current.paused) {
        void audio.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
      } else {
        audio.current.pause()
        setPlaying(false)
      }
    }}>
      <Play className="h-3.5 w-3.5" />{playing ? "Playing" : `Preview ${label}`}
    </Button>
  </>
}

function selectedAudio(content: MarketingContent) {
  const audio = (content.composition as { audio?: Partial<ReelComposition["audio"]> }).audio
  return {
    type: audio?.type === "uploaded" ? "uploaded" : "none",
    id: typeof audio?.id === "string" ? audio.id : null,
    label: typeof audio?.label === "string" ? audio.label : "Silent Reel",
    durationSeconds: typeof audio?.durationSeconds === "number" ? audio.durationSeconds : null,
  }
}

export function ReelAudioControls({
  content,
  tracks,
  draftVersion,
}: {
  content: MarketingContent
  tracks: MarketingAudioTrack[]
  /** The unrendered version is the real edit source, not the old video. */
  draftVersion?: MarketingReelVersion | null
}) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const selected = selectedAudio(draftVersion ? { ...content, composition: draftVersion.composition } : content)
  const track = selected.id ? tracks.find(item => item.id === selected.id) : undefined
  const editable = ["draft", "changes_requested", "ready_for_review", "failed", "approved"].includes(content.status)

  function persist(audio: ReelComposition["audio"], success: string) {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/content/${content.id}/audio`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioTrackId: audio.type === "uploaded" ? audio.id ?? null : null }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string; version?: { versionNumber?: number }; createdDraft?: boolean }
      setMessage(response.ok
        ? `${success} ${data.createdDraft ? `Version ${data.version?.versionNumber ?? "new"} now requires approval and re-rendering.` : "Re-render required after approval."}`
        : data.error ?? "Could not update Reel audio.")
      if (response.ok) {
        setOpen(false)
        router.refresh()
      }
    })
  }

  const hasSelectedTrack = selected.type === "uploaded" && Boolean(track)

  return <section className="space-y-3 rounded-xl bg-muted/35 p-4 ring-1 ring-border/70">
    <div className="flex flex-wrap items-baseline justify-between gap-2"><div><p className="text-sm font-semibold">Audio</p><p className="mt-0.5 text-xs text-muted-foreground">Licensed, user-uploaded tracks only.</p></div>{draftVersion && !draftVersion.renderedAssetId && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Re-render required</span>}</div>
    {hasSelectedTrack ? <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg bg-background px-3 py-2.5 text-sm shadow-xs ring-1 ring-border/70">
      <Music2 className="h-4 w-4 shrink-0 text-primary" />
      <span className="font-medium">{track!.title}</span><span className="text-muted-foreground">· {formatDuration(track!.durationSeconds)}</span>
      <AudioPreviewButton url={track!.signedUrl} label={track!.title} />
      {editable && <span className="ml-auto flex gap-1"><Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)} disabled={isPending}>Change</Button><Button type="button" size="sm" variant="ghost" onClick={() => persist({ type: "none", label: "Silent Reel" }, "Silent Reel selected.")} disabled={isPending}>Remove</Button></span>}
    </div> : <>
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-background p-2 shadow-xs ring-1 ring-border/70">
        <Button type="button" size="sm" variant={selected.type === "none" ? "secondary" : "ghost"} onClick={() => persist({ type: "none", label: "Silent Reel" }, "Silent Reel selected.")} disabled={!editable || isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <VolumeX className="h-4 w-4" />}Silent
        </Button>
        {editable && <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)} disabled={isPending || !tracks.length}><Music2 className="h-4 w-4" />Select from Audio Library</Button>}
      </div>
      {!tracks.length && <p className="text-xs text-muted-foreground">No licensed tracks yet. Add owned or permissioned audio in Marketing Settings.</p>}
      {selected.type === "uploaded" && !track && <p className="text-xs text-amber-800">The selected Audio Library track is no longer available. This draft will render silently unless you choose a replacement.</p>}
    </>}
    {message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-lg overflow-y-auto">
        <DialogHeader><DialogTitle>Select from Audio Library</DialogTitle><DialogDescription>Choose only audio your business owns or has permission to use. The selected track is embedded when Railway renders this Reel.</DialogDescription></DialogHeader>
        <div className="space-y-2">
          {tracks.map(item => <div key={item.id} className="flex flex-wrap items-center gap-2 rounded-xl border p-3">
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.title}</p><p className="text-xs text-muted-foreground">{item.artistSource ? `${item.artistSource} · ` : ""}{formatDuration(item.durationSeconds)}</p></div>
            <AudioPreviewButton url={item.signedUrl} label={item.title} />
            <Button type="button" size="sm" onClick={() => persist({ type: "uploaded", id: item.id, label: item.title, durationSeconds: item.durationSeconds }, `Selected ${item.title}.`)} disabled={isPending}>Select</Button>
          </div>)}
          {!tracks.length && <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">No Audio Library tracks are available.</p>}
        </div>
      </DialogContent>
    </Dialog>
  </section>
}
