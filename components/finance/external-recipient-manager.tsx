"use client"

import { useEffect, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"
import { getCommissionRecipients, setCommissionRecipientActive } from "@/lib/repositories/commission-recipient-repository"
import type { CommissionRecipient } from "@/types/commission-recipient"

function label(type: CommissionRecipient["recipientType"]) {
  return type.replaceAll("_", " ")
}

export function ExternalRecipientManager() {
  const [recipients, setRecipients] = useState<CommissionRecipient[]>([])
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    void getCommissionRecipients(false)
      .then(setRecipients)
      .catch(() => setError("Unable to load external recipients."))
  }, [])

  function toggle(recipient: CommissionRecipient) {
    startTransition(async () => {
      try {
        const updated = await setCommissionRecipientActive(recipient.id, !recipient.isActive)
        setRecipients((current) => current.map((item) => item.id === updated.id ? updated : item))
      } catch {
        setError("Unable to update the recipient status.")
      }
    })
  }

  return <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-sm">
    <div><h2 className="text-xl font-semibold">External recipients</h2><p className="mt-1 text-sm text-muted-foreground">Inactive recipients remain on historical allocations but cannot be chosen for new ones.</p></div>
    {error && <p className="text-sm text-destructive">{error}</p>}
    {recipients.length === 0 ? <p className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">External brokers and partners created from a commission allocation will appear here.</p> : <div className="space-y-2">{recipients.map((recipient) => <div key={recipient.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium">{recipient.name}</p><p className="text-sm capitalize text-muted-foreground">{label(recipient.recipientType)}{recipient.companyName ? ` · ${recipient.companyName}` : ""}</p></div><div className="flex items-center gap-3"><span className={`rounded-full px-2 py-1 text-xs ${recipient.isActive ? "bg-green-100 text-green-800" : "bg-muted text-muted-foreground"}`}>{recipient.isActive ? "Active" : "Inactive"}</span><Button size="sm" variant="outline" disabled={pending} onClick={() => toggle(recipient)}>{recipient.isActive ? "Mark inactive" : "Reactivate"}</Button></div></div>)}</div>}
  </section>
}
