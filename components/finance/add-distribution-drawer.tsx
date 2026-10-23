"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { FormDrawer } from "@/components/forms/form-drawer"
import { Button } from "@/components/ui/button"
import { createCommissionRecipient, getActiveCommissionRecipients } from "@/lib/repositories/commission-recipient-repository"
import { createCommissionDistribution, deleteCommissionDistributionGroup } from "@/lib/repositories/commission-distribution-repository"
import { getActiveAssignableUserProfiles } from "@/lib/repositories/user-profile-repository"
import type { Commission } from "@/types/commission"
import type { CommissionDistribution, CommissionDistributionRole, CommissionDistributionRecipientKind } from "@/types/commission-distribution"
import type { CommissionRecipient, CommissionRecipientType } from "@/types/commission-recipient"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  commissions: Commission[]
  editingCommissionId?: string
  editingDistributions?: CommissionDistribution[]
}

type Split = {
  recipientKind: CommissionDistributionRecipientKind
  userId: string
  externalRecipientId: string
  role: CommissionDistributionRole
  amount: string
}

const emptySplit = (): Split => ({ recipientKind: "crm_user", userId: "", externalRecipientId: "", role: "partner", amount: "" })

const recipientTypes: Array<{ value: CommissionRecipientType; label: string }> = [
  { value: "broker", label: "Broker" }, { value: "co_broker", label: "Co-broker" },
  { value: "referral_partner", label: "Referral partner" }, { value: "channel_partner", label: "Channel partner" },
  { value: "consultant", label: "Consultant" }, { value: "other", label: "Other" },
]

export function AddDistributionDrawer({ open, onOpenChange, commissions, editingCommissionId, editingDistributions }: Props) {
  const router = useRouter()
  const isEditing = Boolean(editingCommissionId)
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([])
  const [externalRecipients, setExternalRecipients] = useState<CommissionRecipient[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [commissionId, setCommissionId] = useState("")
  const [splits, setSplits] = useState<Split[]>([emptySplit()])
  const [showNewExternal, setShowNewExternal] = useState(false)
  const [newRecipient, setNewRecipient] = useState({ name: "", recipientType: "broker" as CommissionRecipientType, companyName: "", phone: "", email: "", notes: "" })

  useEffect(() => {
    if (!open) return
    async function loadOptions() {
      const [activeUsers, activeRecipients] = await Promise.all([getActiveAssignableUserProfiles(), getActiveCommissionRecipients()])
      setUsers(activeUsers.map((user) => ({ id: user.id, name: user.name })))
      setExternalRecipients(activeRecipients)
    }
    void loadOptions().catch(() => setError("Unable to load eligible recipients."))
    setError(null)
    setShowNewExternal(false)
    if (editingCommissionId && editingDistributions) {
      setCommissionId(editingCommissionId)
      setSplits(editingDistributions.map((item) => ({
        recipientKind: item.recipientKind, userId: item.userId ?? "", externalRecipientId: item.externalRecipientId ?? "", role: item.role, amount: String(item.amount),
      })))
    } else {
      setCommissionId("")
      setSplits([emptySplit()])
    }
  }, [editingCommissionId, editingDistributions, open])

  const selectedCommission = commissions.find((commission) => commission.id === commissionId)
  const totalCommission = selectedCommission?.amount ?? 0
  const allocated = useMemo(() => splits.reduce((total, split) => total + Number(split.amount || 0), 0), [splits])
  const historicalInactiveRecipient = Boolean(isEditing && editingDistributions?.some(
    (distribution) => distribution.recipientKind === "crm_user" && distribution.recipientIsActive === false
  ))

  function updateSplit(index: number, patch: Partial<Split>) {
    setSplits((current) => current.map((split, currentIndex) => currentIndex === index ? { ...split, ...patch } : split))
  }

  function recipientKey(split: Split) {
    return split.recipientKind === "crm_user" ? `crm:${split.userId}` : `external:${split.externalRecipientId}`
  }

  async function addExternalRecipient() {
    try {
      const recipient = await createCommissionRecipient(newRecipient)
      setExternalRecipients((current) => [...current, recipient].sort((a, b) => a.name.localeCompare(b.name)))
      setNewRecipient({ name: "", recipientType: "broker", companyName: "", phone: "", email: "", notes: "" })
      setShowNewExternal(false)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create the external recipient.")
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const completeSplits = splits.filter((split) => (split.recipientKind === "crm_user" ? split.userId : split.externalRecipientId) && Number(split.amount) > 0)
    const hasIncompleteSplit = splits.some((split) => Boolean(split.recipientKind === "crm_user" ? split.userId : split.externalRecipientId) !== Boolean(split.amount))
    if (!selectedCommission) return setError("Select the commission to distribute.")
    if (!completeSplits.length || hasIncompleteSplit) return setError("Add an eligible recipient and a positive amount for every allocation.")
    if (new Set(completeSplits.map(recipientKey)).size !== completeSplits.length) return setError("Each recipient can appear only once on a commission.")
    if (allocated > totalCommission) return setError("The allocation total cannot exceed the parent commission.")
    if (historicalInactiveRecipient) return setError("Historical inactive CRM recipients are retained for audit history and cannot be rewritten. Add a new allocation instead.")

    setLoading(true)
    setError(null)
    try {
      if (isEditing && editingCommissionId) await deleteCommissionDistributionGroup(editingCommissionId)
      for (const split of completeSplits) {
        await createCommissionDistribution({
          commissionId, recipientKind: split.recipientKind,
          userId: split.recipientKind === "crm_user" ? split.userId : undefined,
          externalRecipientId: split.recipientKind === "external" ? split.externalRecipientId : undefined,
          role: split.role, amount: Number(split.amount), status: "pending",
        })
      }
      onOpenChange(false)
      router.refresh()
    } catch (caught) {
      console.error(caught)
      setError("Unable to save the commission allocations. No allocation is valid above its parent commission.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormDrawer open={open} onOpenChange={onOpenChange} title={isEditing ? "Edit Commission Allocations" : "Record Commission Allocations"} description="Allocate a commission to active CRM recipients or external financial counterparties.">
      <form onSubmit={submit} className="space-y-5 pt-5">
        <select className="w-full rounded-lg border bg-background p-3" value={commissionId} onChange={(event) => setCommissionId(event.target.value)} required disabled={isEditing}>
          <option value="">Select Commission</option>
          {commissions.map((commission) => <option key={commission.id} value={commission.id}>{commission.dealName} — ₹{commission.amount.toLocaleString("en-IN")}</option>)}
        </select>
        <div className="rounded-xl bg-muted p-4 text-sm">
          <div className="flex justify-between"><span>Total commission</span><strong>₹{totalCommission.toLocaleString("en-IN")}</strong></div>
          <div className="mt-1 flex justify-between"><span>Allocated</span><strong>₹{allocated.toLocaleString("en-IN")}</strong></div>
          <div className="mt-1 flex justify-between"><span>Unallocated</span><strong>₹{Math.max(totalCommission - allocated, 0).toLocaleString("en-IN")}</strong></div>
        </div>
        {historicalInactiveRecipient && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">This historical allocation includes an inactive CRM recipient. It remains visible but is not editable.</p>}
        {splits.map((split, index) => (
          <div key={index} className="space-y-3 rounded-xl border p-4">
            <div className="flex items-center justify-between gap-3"><p className="font-medium">Allocation {index + 1}</p>{splits.length > 1 && <Button type="button" variant="ghost" size="sm" onClick={() => setSplits((current) => current.filter((_, currentIndex) => currentIndex !== index))}>Remove</Button>}</div>
            <select className="w-full rounded-lg border bg-background p-3" value={split.recipientKind} onChange={(event) => updateSplit(index, { recipientKind: event.target.value as CommissionDistributionRecipientKind, userId: "", externalRecipientId: "" })}><option value="crm_user">Active CRM user</option><option value="external">External recipient</option></select>
            {split.recipientKind === "crm_user" ? (
              <select className="w-full rounded-lg border bg-background p-3" value={split.userId} onChange={(event) => updateSplit(index, { userId: event.target.value })}><option value="">Select active CRM user</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select>
            ) : (
              <select className="w-full rounded-lg border bg-background p-3" value={split.externalRecipientId} onChange={(event) => updateSplit(index, { externalRecipientId: event.target.value })}><option value="">Select external recipient</option>{externalRecipients.map((recipient) => <option key={recipient.id} value={recipient.id}>{recipient.name}{recipient.companyName ? ` — ${recipient.companyName}` : ""}</option>)}</select>
            )}
            <select className="w-full rounded-lg border bg-background p-3" value={split.role} onChange={(event) => updateSplit(index, { role: event.target.value as CommissionDistributionRole })}><option value="partner">Partner</option><option value="sales">Sales</option><option value="client_source">Client source</option><option value="inventory_source">Inventory source</option><option value="client_inventory">Client &amp; inventory</option><option value="other">Other</option></select>
            <input className="w-full rounded-lg border bg-background p-3" type="number" min="0.01" step="0.01" placeholder="Allocation amount" value={split.amount} onChange={(event) => updateSplit(index, { amount: event.target.value })} />
          </div>
        ))}
        <div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={() => setSplits((current) => [...current, emptySplit()])}>+ Add allocation</Button><Button type="button" variant="outline" onClick={() => setShowNewExternal((current) => !current)}>+ New external recipient</Button></div>
        {showNewExternal && <div className="space-y-3 rounded-xl border bg-muted/30 p-4"><p className="font-medium">New external recipient</p><input className="w-full rounded-lg border bg-background p-3" placeholder="Name *" value={newRecipient.name} onChange={(event) => setNewRecipient((current) => ({ ...current, name: event.target.value }))} /><select className="w-full rounded-lg border bg-background p-3" value={newRecipient.recipientType} onChange={(event) => setNewRecipient((current) => ({ ...current, recipientType: event.target.value as CommissionRecipientType }))}>{recipientTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select><input className="w-full rounded-lg border bg-background p-3" placeholder="Company (optional)" value={newRecipient.companyName} onChange={(event) => setNewRecipient((current) => ({ ...current, companyName: event.target.value }))} /><input className="w-full rounded-lg border bg-background p-3" placeholder="Phone (optional)" value={newRecipient.phone} onChange={(event) => setNewRecipient((current) => ({ ...current, phone: event.target.value }))} /><input className="w-full rounded-lg border bg-background p-3" type="email" placeholder="Email (optional)" value={newRecipient.email} onChange={(event) => setNewRecipient((current) => ({ ...current, email: event.target.value }))} /><textarea className="w-full rounded-lg border bg-background p-3" placeholder="Notes (optional)" value={newRecipient.notes} onChange={(event) => setNewRecipient((current) => ({ ...current, notes: event.target.value }))} /><Button type="button" variant="secondary" onClick={() => void addExternalRecipient()}>Save recipient</Button></div>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" type="submit" disabled={loading || historicalInactiveRecipient}>{loading ? "Saving…" : isEditing ? "Save allocations" : "Record allocations"}</Button>
      </form>
    </FormDrawer>
  )
}
