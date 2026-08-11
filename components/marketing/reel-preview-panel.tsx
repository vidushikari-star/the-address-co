import { Music2, VolumeX } from "lucide-react"

import { currentRenderedReelVersion, editableReelVersion } from "@/lib/marketing/reel-version-state"
import type { MarketingAsset, MarketingAudioTrack, MarketingContent, MarketingReelVersion } from "@/lib/marketing/types"

function formatDuration(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds))
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`
}

function titleCase(value: string | undefined) {
  return (value ?? "lower_left").replaceAll("_", " ")
}

function assetForVersion(assets: MarketingAsset[], version: MarketingReelVersion | null) {
  return version?.renderedAssetId ? assets.find(asset => asset.id === version.renderedAssetId) ?? null : null
}

/**
 * An honest pre-render preview: a storyboard shows the saved draft inputs,
 * while the video below is only ever a previously rendered derivative.
 */
export function ReelPreviewPanel({
  content,
  versions,
  assets,
  tracks,
}: {
  content: MarketingContent
  versions: MarketingReelVersion[]
  assets: MarketingAsset[]
  tracks: MarketingAudioTrack[]
}) {
  const draft = editableReelVersion(versions)
  const currentRendered = currentRenderedReelVersion(versions)
  const currentAsset = assetForVersion(assets, currentRendered)
  const currentUrl = currentAsset?.signedUrl ?? content.renderedUrl ?? null
  const selectedAudio = draft?.composition.audio
  const selectedTrack = selectedAudio?.id ? tracks.find(track => track.id === selectedAudio.id) : null

  return <div className="space-y-3">
    {draft && <section className="rounded-xl border border-primary/20 bg-card p-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">Draft preview · Version {draft.versionNumber}</p><p className="mt-1 text-xs text-muted-foreground">Saved storyboard inputs — not yet a rendered video.</p></div><span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Re-render required</span></div>
      <div className="mt-3 space-y-2">
        {draft.composition.scenes.map((scene, index) => <div key={`${scene.assetId}-${scene.start}-${index}`} className="rounded-lg bg-muted/55 px-3 py-2">
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold">Scene {index + 1}</p><p className="text-[11px] capitalize text-muted-foreground">{titleCase(scene.overlay?.position)} · {Math.round(scene.duration)}s</p></div>
          <p className="mt-1 line-clamp-3 text-xs leading-5 text-muted-foreground">{scene.overlay?.text?.trim() || "No overlay text"}</p>
        </div>)}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-muted/55 px-3 py-2 text-xs">
        {selectedAudio?.type === "uploaded" && selectedTrack ? <><Music2 className="h-3.5 w-3.5 text-primary" /><span className="font-medium">{selectedTrack.title}</span><span className="text-muted-foreground">· {formatDuration(selectedTrack.durationSeconds)}</span>{selectedTrack.signedUrl && <audio controls className="h-7 max-w-44" preload="metadata" src={selectedTrack.signedUrl}>Audio preview unavailable.</audio>}</> : selectedAudio?.type === "uploaded" ? <><Music2 className="h-3.5 w-3.5 text-amber-700" /><span className="text-amber-800">Selected audio is no longer in the library. This draft will render silently.</span></> : <><VolumeX className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Silent Reel</span></>}
      </div>
    </section>}

    {currentUrl ? <section className="rounded-xl border bg-card p-3 shadow-xs"><p className="text-xs font-semibold tracking-[0.12em] text-muted-foreground uppercase">Current rendered version{currentRendered ? ` · Version ${currentRendered.versionNumber}` : ""}</p><p className="mt-1 text-xs text-muted-foreground">This video retains its original audio and overlay treatment.</p><video className="mt-3 aspect-[9/16] w-full rounded-lg bg-black object-contain" controls preload="metadata" src={currentUrl} /></section> : !draft ? <div className="grid aspect-[4/3] place-items-center rounded-xl border border-dashed bg-muted/40 p-6 text-center text-xs text-muted-foreground">Preview unavailable — draft data is saved. Generate or render this Reel to create a media preview.</div> : null}
  </div>
}
