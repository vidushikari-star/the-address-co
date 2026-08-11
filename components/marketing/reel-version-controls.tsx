"use client"

import { Clapperboard, Loader2, RefreshCw, Sparkles, Trash2 } from "lucide-react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import type { MarketingAsset, MarketingContent, MarketingReelVersion } from "@/lib/marketing/types"

function formatVersion(version: MarketingReelVersion) {
  return `${version.composition.scenes.length} scenes · ${Math.round(version.composition.duration)}s · ${version.composition.logo?.placement?.replaceAll("_", " ") ?? "no logo"}`
}

export function ReelVersionControls({ content, versions, assets }: { content: MarketingContent; versions: MarketingReelVersion[]; assets: MarketingAsset[] }) {
  const router = useRouter()
  const [prompt, setPrompt] = useState("")
  const [message, setMessage] = useState<string | null>(null)
  const [improveOpen, setImproveOpen] = useState(false)
  const [deleteVersion, setDeleteVersion] = useState<MarketingReelVersion | null>(null)
  const [isPending, startTransition] = useTransition()
  const latest = versions[0]
  const previous = versions[1]

  function request(path: string, options?: RequestInit, success?: string) {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(path, options)
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) return setMessage(data.error ?? "The Reel version action could not be completed.")
      if (success) setMessage(success)
      router.refresh()
    })
  }

  function improve() {
    if (prompt.trim().length < 3) return setMessage("Add a short creative instruction first.")
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/content/${content.id}/reel/improve`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: prompt.trim() }) })
      const data = await response.json().catch(() => ({})) as { error?: string }
      if (!response.ok) return setMessage(data.error ?? "The improved storyboard could not be created.")
      setImproveOpen(false)
      setPrompt("")
      setMessage("A revised storyboard is ready for review.")
      router.refresh()
    })
  }

  const canImprove = ["approved", "ready_for_review"].includes(content.status)
  const improveUnavailableReason = content.status === "rendering"
    ? "Wait for the current render to finish before creating another version."
    : "Approve or return this Reel to review before creating an improved version."

  return <section className="space-y-4 rounded-xl border p-4">
    <div><p className="text-sm font-semibold">Reel versions</p><p className="mt-1 text-xs text-muted-foreground">New AI creative is always a separate draft. The active rendered version remains available for scheduling until you explicitly make another one current.</p></div>
    <div className="flex flex-wrap items-center gap-2"><Button type="button" onClick={() => setImproveOpen(true)} disabled={isPending || !canImprove} title={!canImprove ? improveUnavailableReason : undefined}><Sparkles className="h-4 w-4" />Improve / Re-render with AI</Button>{!canImprove && <p className="text-xs text-muted-foreground">{improveUnavailableReason}</p>}</div>
    {message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}
    {latest && previous && <div className="grid gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground sm:grid-cols-2"><p><strong className="text-foreground">Latest · V{latest.versionNumber}</strong><br />{formatVersion(latest)}</p><p><strong className="text-foreground">Previous · V{previous.versionNumber}</strong><br />{formatVersion(previous)}</p></div>}
    <div className="space-y-3">{versions.map(version => {
      const rendered = assets.find(asset => asset.id === version.renderedAssetId)
      return <article key={version.id} className="rounded-lg border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-medium">Version {version.versionNumber}{version.isCurrent ? <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Current</span> : null}{!version.renderedAssetId && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">Editing</span>}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{version.status} · {formatVersion(version)}{version.status === "draft" ? " · approval required" : ""}</p></div><div className="flex flex-wrap gap-1">{version.status === "approved" && <Button type="button" size="sm" onClick={() => request(`/api/marketing/content/${content.id}/reel/versions/${version.id}/render`, { method: "POST" }, "The new version has been queued for Railway rendering.")} disabled={isPending}><Clapperboard className="h-3.5 w-3.5" />Render new version</Button>}{version.status === "rendered" && !version.isCurrent && <Button type="button" size="sm" variant="outline" onClick={() => request(`/api/marketing/content/${content.id}/reel/versions/${version.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "make_current" }) }, "This is now the active Reel version for scheduling.")} disabled={isPending}>Make current</Button>}{version.status === "rendered" && <Button type="button" size="sm" variant="ghost" onClick={() => request(`/api/marketing/content/${content.id}/reel/versions/${version.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "duplicate" }) }, "A re-render draft was created and requires approval.")} disabled={isPending}><RefreshCw className="h-3.5 w-3.5" />Re-render as draft</Button>}{version.status === "draft" && <Button type="button" size="sm" variant="ghost" onClick={() => setDeleteVersion(version)} disabled={isPending}><Trash2 className="h-3.5 w-3.5" />Delete draft</Button>}</div></div>
        {rendered?.signedUrl && <video className="mt-3 aspect-[9/16] max-h-60 rounded-md bg-black" controls preload="metadata" src={rendered.signedUrl} />}
        {version.userPrompt && <p className="mt-2 text-xs text-muted-foreground">Instruction: {version.userPrompt}</p>}
        {version.lastError && <p className="mt-2 text-xs text-red-700">{version.lastError}</p>}
      </article>
    })}{!versions.length && <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">The first AI revision will preserve the existing Reel as Version 1.</p>}</div>
    {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
    <Dialog open={improveOpen} onOpenChange={setImproveOpen}>
      <DialogContent className="max-w-xl" showCloseButton={!isPending}>
        <form onSubmit={event => { event.preventDefault(); improve() }}>
          <DialogHeader><DialogTitle>Improve / Re-render with AI</DialogTitle><DialogDescription>Describe the creative change. A new, fact-grounded draft storyboard will be created; the current rendered Reel remains untouched.</DialogDescription></DialogHeader>
          <label className="mt-4 grid gap-2 text-sm font-medium">Creative instruction<Textarea autoFocus value={prompt} onChange={event => setPrompt(event.target.value)} rows={5} maxLength={600} placeholder="Make this Reel more minimal, use less text, focus on the pool, and keep the logo only on the end card." /></label>
          <p className="mt-2 text-xs text-muted-foreground">{prompt.length}/600 · Overlay copy is shortened for mobile-safe Reel layouts.</p>
          <DialogFooter className="mt-4"><Button type="button" variant="outline" onClick={() => setImproveOpen(false)} disabled={isPending}>Cancel</Button><Button type="submit" disabled={isPending || prompt.trim().length < 3}>{isPending && <Loader2 className="h-4 w-4 animate-spin" />}Generate improved version</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <ConfirmDialog open={Boolean(deleteVersion)} onOpenChange={open => !open && setDeleteVersion(null)} title="Delete unused Reel draft?" description="Only the editable version record will be removed. Original CRM media and prior rendered versions are never deleted." confirmLabel="Delete draft version" onConfirm={() => { if (deleteVersion) { request(`/api/marketing/content/${content.id}/reel/versions/${deleteVersion.id}`, { method: "DELETE" }, "Unused Reel draft deleted."); setDeleteVersion(null) } }} loading={isPending} />
  </section>
}
