"use client"

import { Clapperboard, ExternalLink, Loader2, RotateCcw } from "lucide-react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { ApprovalActions } from "@/components/marketing/approval-actions"
import { MarketingPublishingActions } from "@/components/marketing/marketing-publishing-actions"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { contentRequiresRendering } from "@/lib/marketing/content-delivery"
import type { MarketingContent, MarketingPublication } from "@/lib/marketing/types"

export function ContentWorkflowActions({
  content,
  hasReadyMedia,
  publishingEnabled,
  publication,
}: {
  content: MarketingContent
  hasReadyMedia: boolean
  publishingEnabled: boolean
  publication?: MarketingPublication | null
}) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [confirmScheduledDelete, setConfirmScheduledDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const requiresRender = contentRequiresRendering(content)

  function render() {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/content/${content.id}/render`, { method: "POST" })
      const data = await response.json().catch(() => ({})) as { error?: string }
      setMessage(response.ok ? "Reel rendering has been queued." : data.error ?? "Could not queue the Reel render.")
      if (response.ok) router.refresh()
    })
  }

  function retryPublishing() {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/publish/${content.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ retry: true }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string }
      setMessage(response.ok ? "Safe publishing retry queued for the protected worker." : data.error ?? "This publication cannot be retried automatically.")
      if (response.ok) router.refresh()
    })
  }

  function scheduledAction(action: "unschedule" | "delete") {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch("/api/marketing/content/scheduled", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ids: [content.id] }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string; message?: string }
      setConfirmScheduledDelete(false)
      setMessage(response.ok ? data.message ?? "Scheduled content updated." : data.error ?? "This scheduled item could not be updated safely.")
      if (response.ok) router.refresh()
    })
  }

  if (content.status === "published") {
    return <section className="space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
      <p className="text-sm font-semibold text-emerald-950">Published</p>
      <p className="text-xs text-emerald-900">Published: {content.publishedAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(content.publishedAt)) : "Recorded by Instagram"}</p>
      {publication?.instagramMediaId && <p className="text-xs text-emerald-900">Instagram media ID: <code>{publication.instagramMediaId}</code></p>}
      {publication?.permalink && <a href={publication.permalink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 underline"><ExternalLink className="h-3.5 w-3.5" />View on Instagram</a>}
    </section>
  }

  if (["draft", "ready_for_review", "changes_requested"].includes(content.status)) {
    return <section className="space-y-3 rounded-xl border p-4">
      <div><p className="text-sm font-semibold">Review and approval</p><p className="mt-1 text-xs text-muted-foreground">Approval is recorded server-side with the approving administrator and timestamp.</p></div>
      <ApprovalActions contentId={content.id} status={content.status} />
    </section>
  }

  if (content.status === "scheduled") {
    return <section className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/40 p-4"><div><p className="text-sm font-semibold">Scheduled content controls</p><p className="mt-1 text-xs text-muted-foreground">Unscheduling preserves approvals and rendered media. Deletion re-checks the database and will skip the item if publishing has started.</p></div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => scheduledAction("unschedule")} disabled={isPending}>Unschedule</Button><Button type="button" size="sm" variant="destructive" onClick={() => setConfirmScheduledDelete(true)} disabled={isPending}>Delete scheduled item</Button></div>{message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}<ConfirmDialog open={confirmScheduledDelete} onOpenChange={setConfirmScheduledDelete} title="Delete scheduled Marketing item?" description="Its queued publishing job will be cancelled. Marketing-generated derivatives may be removed where appropriate. Original CRM property images and videos will not be deleted." confirmLabel="Delete scheduled item" onConfirm={() => scheduledAction("delete")} loading={isPending} /></section>
  }

  if (content.status === "approved") {
    return <section className="space-y-4">
      <div className="rounded-xl border p-4"><p className="text-sm font-semibold">Approved</p><p className="mt-1 text-xs text-muted-foreground">{requiresRender ? hasReadyMedia ? "Render ready. This approved Reel can now be scheduled." : "This approved Reel needs rendering before it can be scheduled." : "This approved post uses the selected original CRM media and is ready to schedule without FFmpeg rendering."}</p><div className="mt-3"><ApprovalActions contentId={content.id} status="approved" /></div></div>
      {requiresRender && !hasReadyMedia ? <div className="space-y-2 rounded-xl border p-4"><Button type="button" size="sm" onClick={render} disabled={isPending}><Clapperboard className="h-4 w-4" />Render Reel</Button>{isPending && <Loader2 className="inline h-4 w-4 animate-spin text-muted-foreground" />}{message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}</div> : <MarketingPublishingActions contentId={content.id} canPublishNow={publishingEnabled} />}
    </section>
  }

  if (content.status === "failed" && publication) {
    const safelyRetryable = publishingEnabled && !publication.instagramMediaId && !publication.publishAttemptedAt
    return <section className="space-y-3 rounded-xl border border-red-200 p-4"><p className="text-sm font-semibold">Publishing failed</p><p className="text-xs text-muted-foreground">{publication.lastError ?? content.lastError ?? "The Instagram publication did not complete."}</p>{safelyRetryable ? <Button type="button" size="sm" variant="outline" onClick={retryPublishing} disabled={isPending}><RotateCcw className="h-4 w-4" />Retry Publishing</Button> : <p className="text-xs text-muted-foreground">Automatic retry is unavailable because Meta may already have received a publish request. Verify Instagram before creating another attempt.</p>}{message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}</section>
  }

  if (content.status === "failed" && requiresRender) {
    return <section className="space-y-2 rounded-xl border border-red-200 p-4"><p className="text-sm font-semibold">Render failed</p><p className="text-xs text-muted-foreground">{content.lastError ?? "Fix copy or audio if needed, then re-approve before retrying. You cannot schedule or publish a failed Reel."}</p><Button type="button" size="sm" variant="outline" onClick={render} disabled={isPending}><Clapperboard className="h-4 w-4" />Retry render</Button>{message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}</section>
  }

  return null
}
