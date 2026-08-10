"use client"

import { useState, useTransition } from "react"
import { Check, Loader2, PencilLine, X } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function ApprovalActions({ contentId }: { contentId: string }) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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

  return <div className="space-y-2"><div className="flex flex-wrap gap-2"><Button onClick={() => act("approve")} disabled={isPending}><Check className="h-4 w-4" />Approve</Button><Button variant="outline" onClick={() => act("request_changes")} disabled={isPending}><PencilLine className="h-4 w-4" />Request changes</Button><Button variant="destructive" onClick={() => act("reject")} disabled={isPending}><X className="h-4 w-4" />Reject</Button>{isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}</div>{message && <p className="text-xs text-destructive">{message}</p>}</div>
}
