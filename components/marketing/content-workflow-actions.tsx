"use client"

import { Clapperboard, Loader2 } from "lucide-react"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { ApprovalActions } from "@/components/marketing/approval-actions"
import { MarketingPublishingActions } from "@/components/marketing/marketing-publishing-actions"
import { Button } from "@/components/ui/button"
import { contentRequiresRendering } from "@/lib/marketing/content-delivery"
import type { MarketingContent } from "@/lib/marketing/types"

export function ContentWorkflowActions({
  content,
  hasReadyMedia,
  publishingEnabled,
}: {
  content: MarketingContent
  hasReadyMedia: boolean
  publishingEnabled: boolean
}) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
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

  if (["draft", "ready_for_review", "changes_requested"].includes(content.status)) {
    return <section className="space-y-3 rounded-xl border p-4">
      <div><p className="text-sm font-semibold">Review and approval</p><p className="mt-1 text-xs text-muted-foreground">Approval is recorded server-side with the approving administrator and timestamp.</p></div>
      <ApprovalActions contentId={content.id} status={content.status} />
    </section>
  }

  if (content.status === "approved") {
    return <section className="space-y-4">
      <div className="rounded-xl border p-4"><p className="text-sm font-semibold">Approved</p><p className="mt-1 text-xs text-muted-foreground">{requiresRender ? hasReadyMedia ? "Render ready. This approved Reel can now be scheduled." : "This approved Reel needs rendering before it can be scheduled." : "This approved post uses the selected original CRM media and is ready to schedule without FFmpeg rendering."}</p><div className="mt-3"><ApprovalActions contentId={content.id} status="approved" /></div></div>
      {requiresRender && !hasReadyMedia ? <div className="space-y-2 rounded-xl border p-4"><Button type="button" size="sm" onClick={render} disabled={isPending}><Clapperboard className="h-4 w-4" />Render Reel</Button>{isPending && <Loader2 className="inline h-4 w-4 animate-spin text-muted-foreground" />}{message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}</div> : <MarketingPublishingActions contentId={content.id} canPublishNow={publishingEnabled} />}
    </section>
  }

  if (content.status === "failed" && requiresRender) {
    return <section className="space-y-2 rounded-xl border border-red-200 p-4"><p className="text-sm font-semibold">Render failed</p><p className="text-xs text-muted-foreground">{content.lastError ?? "Fix copy or audio if needed, then re-approve before retrying. You cannot schedule or publish a failed Reel."}</p><Button type="button" size="sm" variant="outline" onClick={render} disabled={isPending}><Clapperboard className="h-4 w-4" />Retry render</Button>{message && <p className="text-xs text-muted-foreground" role="status">{message}</p>}</section>
  }

  return null
}
