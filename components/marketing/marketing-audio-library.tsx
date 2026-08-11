"use client"

import { Loader2, Music2, Pencil, Play, Trash2, Upload } from "lucide-react"
import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { MarketingAudioTrack } from "@/lib/marketing/types"
import { supabase } from "@/lib/supabase/client"

const MAX_AUDIO_BYTES = 25 * 1024 * 1024
const MAX_BULK_FILES = 25
const AUDIO_FORMATS = {
  mp3: { mimeType: "audio/mpeg", declaredTypes: ["audio/mpeg", "audio/mp3"] },
  m4a: { mimeType: "audio/mp4", declaredTypes: ["audio/mp4", "audio/x-m4a", "audio/m4a"] },
  wav: { mimeType: "audio/wav", declaredTypes: ["audio/wav", "audio/wave", "audio/x-wav"] },
} as const

type UploadPhase = "Waiting" | "Validating" | "Uploading" | "Finalizing" | "Uploaded" | "Failed"
type PendingUpload = { id: string; file: File; phase: UploadPhase; error?: string }

function clientFormat(file: File) {
  const extension = file.name.split(".").pop()?.toLocaleLowerCase()
  const format = extension ? AUDIO_FORMATS[extension as keyof typeof AUDIO_FORMATS] : undefined
  if (!format || (file.type && !format.declaredTypes.includes(file.type.toLocaleLowerCase() as never))) {
    throw new Error("Unsupported audio format. Upload an MP3, M4A, or WAV file.")
  }
  if (file.size > MAX_AUDIO_BYTES) throw new Error("File exceeds 25 MB.")
  return format
}

function uploadFailure(error: unknown) {
  const message = error instanceof Error ? error.message : ""
  if (/expired|token|signature/i.test(message)) return "Upload permission expired. Try this file again."
  if (/metadata/i.test(message)) return "Audio metadata could not be finalized."
  if (/format|MP3|M4A|WAV/i.test(message)) return message
  return "Storage upload failed. Try this file again."
}

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
  const [uploads, setUploads] = useState<PendingUpload[]>([])
  const [message, setMessage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  function updateUpload(id: string, changes: Partial<PendingUpload>) {
    setUploads(current => current.map(upload => upload.id === id ? { ...upload, ...changes } : upload))
  }

  async function uploadOne(upload: PendingUpload) {
    try {
      updateUpload(upload.id, { phase: "Validating", error: undefined })
      const format = clientFormat(upload.file)
      const durationSeconds = await durationFor(upload.file)
      const permissionResponse = await fetch("/api/marketing/audio/request-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: upload.file.name, mimeType: format.mimeType, fileSize: upload.file.size }),
      })
      const permission = await permissionResponse.json().catch(() => ({})) as { error?: string; storagePath?: string; token?: string; mimeType?: string }
      if (!permissionResponse.ok || !permission.storagePath || !permission.token || !permission.mimeType) {
        throw new Error(permission.error ?? "Upload permission expired. Try this file again.")
      }

      updateUpload(upload.id, { phase: "Uploading" })
      const uploadFile = upload.file.type === permission.mimeType
        ? upload.file
        : new File([upload.file], upload.file.name, { type: permission.mimeType })
      const { error: storageError } = await supabase.storage.from("marketing-audio").uploadToSignedUrl(
        permission.storagePath,
        permission.token,
        uploadFile,
        { contentType: permission.mimeType, upsert: false },
      )
      if (storageError) throw new Error(storageError.message)

      updateUpload(upload.id, { phase: "Finalizing" })
      const finalizeResponse = await fetch("/api/marketing/audio/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storagePath: permission.storagePath,
          filename: upload.file.name,
          title: uploads.length === 1 && title.trim() ? title.trim() : upload.file.name.replace(/\.[^.]+$/, ""),
          artistSource: artistSource.trim() || null,
          mimeType: permission.mimeType,
          fileSize: upload.file.size,
          durationSeconds,
        }),
      })
      const finalized = await finalizeResponse.json().catch(() => ({})) as { error?: string }
      if (!finalizeResponse.ok) throw new Error(finalized.error ?? "Audio metadata could not be finalized.")
      updateUpload(upload.id, { phase: "Uploaded" })
    } catch (error) {
      updateUpload(upload.id, { phase: "Failed", error: uploadFailure(error) })
    }
  }

  function upload() {
    const pending = uploads.filter(upload => upload.phase === "Waiting" || upload.phase === "Failed")
    if (!pending.length) return setMessage("Choose one or more MP3, M4A, or WAV files first.")
    setMessage(null)
    setIsUploading(true)
    void (async () => {
      let next = 0
      // Direct uploads are intentionally bounded: each file has its own
      // signed permission and no request combines file bodies through Vercel.
      const worker = async () => {
        while (next < pending.length) {
          const current = pending[next]
          next += 1
          await uploadOne(current)
        }
      }
      await Promise.all([worker(), worker()])
      setIsUploading(false)
      setTitle(""); setArtistSource("")
      router.refresh()
    })()
  }

  return <section className="rounded-2xl border bg-card p-5 sm:p-6">
    <div><h2 className="font-semibold">Audio Library</h2><p className="mt-1 text-sm text-muted-foreground">Upload music your business owns or has permission to use. These private tracks can be embedded in Railway-rendered Reels; this never accesses Instagram’s licensed or trending catalogue.</p></div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-sm font-medium">Track name <span className="text-xs font-normal text-muted-foreground">Optional; used only for a single upload</span><Input value={title} onChange={event => setTitle(event.target.value)} maxLength={160} placeholder="Defaults to filename" /></label><label className="grid gap-1.5 text-sm font-medium">Artist / source <Input value={artistSource} onChange={event => setArtistSource(event.target.value)} maxLength={240} placeholder="Optional licensing reference" /></label><label className="grid gap-1.5 text-sm font-medium sm:col-span-2">Audio files <Input ref={fileInput} type="file" multiple accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/wav" onChange={event => { const selected = Array.from(event.target.files ?? []); setUploads(selected.slice(0, MAX_BULK_FILES).map(file => ({ id: crypto.randomUUID(), file, phase: "Waiting" }))); setMessage(selected.length > MAX_BULK_FILES ? "Choose up to 25 audio files at a time." : null) }} /><span className="text-xs font-normal text-muted-foreground">Each file uploads directly to private storage, two at a time. MP3, M4A, WAV · 25 MB per file.</span></label></div>
    <div className="mt-4 flex flex-wrap items-center gap-3"><Button type="button" onClick={upload} disabled={isUploading || !uploads.length}>{isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Upload {uploads.length > 1 ? `${uploads.length} licensed tracks` : "licensed audio"}</Button><span className="text-xs text-muted-foreground">Audio bytes never pass through this CRM server.</span></div>
    {uploads.length > 0 && <div className="mt-4 space-y-2 rounded-xl border bg-muted/30 p-3">{uploads.map(upload => <div key={upload.id} className="flex flex-wrap items-center justify-between gap-2 text-xs"><span className="min-w-0 truncate font-medium">{upload.file.name}</span><span className={upload.phase === "Failed" ? "text-red-700" : upload.phase === "Uploaded" ? "text-emerald-700" : "text-muted-foreground"}>{upload.phase}{upload.error ? `: ${upload.error}` : ""}</span></div>)}</div>}
    {message && <p className="mt-3 text-sm text-red-700" role="status">{message}</p>}
    <div className="mt-6 space-y-3">{tracks.map(track => <AudioTrackRow key={track.id} track={track} />)}{!tracks.length && <div className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">Your private Audio Library is empty.</div>}</div>
  </section>
}
