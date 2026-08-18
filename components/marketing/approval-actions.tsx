"use client"

import { useState, useTransition } from "react"
import { Check, Loader2, PencilLine, X } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import type { MarketingStatus } from "@/lib/marketing/types"
import { useStoryCreativeDirty } from "@/lib/marketing/story-editor-state"

export function ApprovalActions({ contentId, status = "ready_for_review", approveDisabledReason }: { contentId: string; status?: MarketingStatus; approveDisabledReason?: string }) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const storyCreativeDirty = useStoryCreativeDirty(contentId)
  const resolvedApproveDisabledReason = approveDisabledReason
    ?? (storyCreativeDirty ? "Save changes before approval." : undefined)

  function act(action: "approve" | "request_changes" | "reject") {
    setMessage(null)
    startTransition(async () => {
      const response = await fetch(`/api/marketing/content/${contentId}/approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { error?: string }
        setMessage(body.error || "Action could not be completed.")
        return
      }
      router.refresh()
    })
  }

  const canApprove = ["draft", "ready_for_review", "changes_requested"].includes(status)
  const canRequestChanges = ["ready_for_review", "approved"].includes(status)
  const canReject = ["ready_for_review", "changes_requested", "approved"].includes(status)

  return <div className="space-y-2"><div className="flex flex-wrap gap-2">{canApprove && <Button onClick={() => act("approve")} disabled={isPending || Boolean(resolvedApproveDisabledReason)} title={resolvedApproveDisabledReason}><Check className="h-4 w-4" />Approve</Button>}{canRequestChanges && <Button variant="outline" onClick={() => act("request_changes")} disabled={isPending}><PencilLine className="h-4 w-4" />Return to edits</Button>}{canReject && <Button variant="destructive" onClick={() => act("reject")} disabled={isPending}><X className="h-4 w-4" />Reject</Button>}{isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}</div>{resolvedApproveDisabledReason && canApprove && <p className="text-xs text-muted-foreground">{resolvedApproveDisabledReason}</p>}{message && <p className="text-xs text-destructive">{message}</p>}</div>
}
