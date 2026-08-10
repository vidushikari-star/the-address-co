"use client"

import { Loader2, Music2, Pencil, Play, Trash2, Upload } from "lucide-react"
import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { MarketingAudioTrack } from "@/lib/marketing/types"

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
      if (audio.current.paused) void audio.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
      else { audio.current.pause(); setPlaying(false) }
    }}><Play className="h-3.5 w-3.5" />{playing ? "Playing" : `Preview ${label}`}</Button>
  </>
}

async function durationFor(file: File) {
  const url = URL.createObjectURL(file)
  try {
    return await new Promise<number>((resolve, reject) => {
      const audio = new Audio()
      audio.preload = "metadata"
      audio.onloadedmetadata = () => Number.isFinite(audio.duration) && audio.duration > 0 ? resolve(audio.duration) : reject(new Error("Audio duration is unavailable."))
      audio.onerror = () => reject(new Error("This audio file could not be read."))
      audio.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

function AudioTrackRow({ track }: { track: MarketingAudioTrack }) {
  const router = useRouter()
  const [title, setTitle] = useState(track.title)
  const [artistSource, setArtistSource] = useState(track.artistSource ?? "")
  const [message, setMessage] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  function save() {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/audio/${track.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, artistSource: artistSource || null }) })
      const data = await response.json().catch(() => ({})) as { error?: string }
      setMessage(response.ok ? "Saved." : data.error ?? "Could not update this track.")
      if (response.ok) router.refresh()
    })
  }

  function remove() {
    startTransition(async () => {
      const response = await fetch(`/api/marketing/audio/${track.id}`, { method: "DELETE" })
      const data = await response.json().catch(() => ({})) as { error?: string }
      setConfirmDelete(false)
      setMessage(response.ok ? null : data.error ?? "Could not delete this track.")
      if (response.ok) router.refresh()
    })
  }

  return <div className="rounded-xl border p-4">
    <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"><label className="grid gap-1 text-xs font-medium">Track name<Input value={title} onChange={event => setTitle(event.target.value)} maxLength={160} /></label><label className="grid gap-1 text-xs font-medium">Artist / source <Input value={artistSource} onChange={event => setArtistSource(event.target.value)} maxLength={240} placeholder="Optional" /></label><div className="flex gap-1"><Button type="button" size="sm" variant="outline" onClick={save} disabled={isPending}><Pencil className="h-3.5 w-3.5" />Save</Button><Button type="button" size="sm" variant="ghost" onClick={() => setConfirmDelete(true)} disabled={isPending}><Trash2 className="h-3.5 w-3.5" /><span className="sr-only">Delete {track.title}</span></Button></div></div>
    <div className="mt-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground"><Music2 className="h-3.5 w-3.5 text-primary" /><span>{track.filename} · {formatDuration(track.durationSeconds)} · {(track.fileSize / 1_048_576).toFixed(1)} MB</span><AudioPreviewButton url={track.signedUrl} label={track.title} /></div>
    {message && <p className="mt-2 text-xs text-red-700" role="status">{message}</p>}
    <ConfirmDialog open={confirmDelete} onOpenChange={setConfirmDelete} title="Delete this audio track?" description="The library track will be removed. Existing rendered Reels stay unchanged; future renders that referenced it will remain silent." confirmLabel="Delete track" onConfirm={remove} loading={isPending} />
  </div>
}

export function MarketingAudioLibrary({ tracks }: { tracks: MarketingAudioTrack[] }) {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState("")
  const [artistSource, setArtistSource] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function upload() {
    if (!file) return setMessage("Choose an MP3, M4A, or WAV file first.")
    setMessage(null)
    startTransition(async () => {
      try {
        const durationSeconds = await durationFor(file)
        const formData = new FormData()
        formData.set("file", file)
        formData.set("title", title || file.name.replace(/\.[^.]+$/, ""))
        formData.set("artistSource", artistSource)
        formData.set("durationSeconds", String(durationSeconds))
        const response = await fetch("/api/marketing/audio", { method: "POST", body: formData })
        const data = await response.json().catch(() => ({})) as { error?: string }
        if (!response.ok) return setMessage(data.error ?? "Could not upload this track.")
        setTitle(""); setArtistSource(""); setFile(null)
        if (fileInput.current) fileInput.current.value = ""
        router.refresh()
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not read this audio file.")
      }
    })
  }

  return <section className="rounded-2xl border bg-card p-5 sm:p-6">
    <div><h2 className="font-semibold">Audio Library</h2><p className="mt-1 text-sm text-muted-foreground">Upload music your business owns or has permission to use. These private tracks can be embedded in Railway-rendered Reels; this never accesses Instagram’s licensed or trending catalogue.</p></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Track name<Input value={title} onChange={event => setTitle(event.target.value)} maxLength={160} placeholder="Defaults to filename" /></label><label className="grid gap-1.5 text-sm font-medium">Artist / source <Input value={artistSource} onChange={event => setArtistSource(event.target.value)} maxLength={240} placeholder="Optional licensing reference" /></label><label className="grid gap-1.5 text-sm font-medium sm:col-span-2">Audio file <Input ref={fileInput} type="file" accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/wav" onChange={event => setFile(event.target.files?.[0] ?? null)} /></label></div>
    <div className="mt-4 flex flex-wrap items-center gap-3"><Button type="button" onClick={upload} disabled={isPending || !file}>{isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Upload licensed audio</Button><span className="text-xs text-muted-foreground">MP3, M4A, or WAV · up to 25 MB</span></div>
    {message && <p className="mt-3 text-sm text-red-700" role="status">{message}</p>}
    <div className="mt-6 space-y-3">{tracks.map(track => <AudioTrackRow key={track.id} track={track} />)}{!tracks.length && <div className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">Your private Audio Library is empty.</div>}</div>
  </section>
}
