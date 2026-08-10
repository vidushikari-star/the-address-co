"use client"

import { useState, useTransition } from "react"
import { Loader2, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

export function CampaignPlanActions({ campaignId }: { campaignId: string }) {
  const router = useRouter()
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  return <div><Button onClick={() => startTransition(async () => { const response = await fetch(`/api/marketing/campaigns/${campaignId}/approve`, { method: "POST" }); const data = await response.json().catch(() => ({})) as { error?: string }; if (!response.ok) setMessage(data.error || "Campaign generation could not be started."); else router.refresh() })} disabled={isPending}><Sparkles className="h-4 w-4" />{isPending ? <><Loader2 className="h-4 w-4 animate-spin" />Starting generation…</> : "Approve plan & generate drafts"}</Button>{message && <p className="mt-2 text-xs text-destructive">{message}</p>}</div>
}
