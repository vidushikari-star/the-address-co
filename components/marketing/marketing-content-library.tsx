"use client"

import { CalendarX2, ListChecks, Trash2 } from "lucide-react"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { MarketingContentCard } from "@/components/marketing/content-card"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { MarketingContent } from "@/lib/marketing/types"

function plural(count: number, singular: string, pluralLabel = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralLabel}`
}

export function MarketingContentLibrary({ content }: { content: MarketingContent[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const eligible = useMemo(() => content.filter(item => item.status === "draft" || item.status === "scheduled"), [content])
  const eligibleIds = useMemo(() => new Set(eligible.map(item => item.id)), [eligible])
  const selectedItems = useMemo(() => content.filter(item => selected.has(item.id)), [content, selected])
  const selectedStatus = selectedItems[0]?.status
  const selectedCount = selectedItems.length
  const drafts = useMemo(() => eligible.filter(item => item.status === "draft"), [eligible])
  const scheduled = useMemo(() => eligible.filter(item => item.status === "scheduled"), [eligible])
  const allVisibleSelected = selectedStatus
    ? eligible.filter(item => item.status === selectedStatus).every(item => selected.has(item.id))
    : false

  useEffect(() => {
    setSelected(current => new Set([...current].filter(id => eligibleIds.has(id))))
  }, [eligibleIds])

  function toggle(item: MarketingContent, checked: boolean) {
    setSelected(current => {
      const next = new Set(current)
      // A single action has a single state model. Changing state categories
      // clears the prior selection instead of silently mixing delete rules.
      if (checked && current.size && selectedStatus !== item.status) return new Set([item.id])
      if (checked) next.add(item.id)
      else next.delete(item.id)
      return next
    })
    setError(null); setMessage(null)
  }

  function selectAllVisible(status: "draft" | "scheduled") {
    setSelected(new Set(eligible.filter(item => item.status === status).map(item => item.id)))
    setError(null); setMessage(null)
  }

  function bulk(action: "delete" | "unschedule") {
    startTransition(async () => {
      const endpoint = selectedStatus === "draft" ? "/api/marketing/content/bulk-delete" : "/api/marketing/content/scheduled"
      const body = selectedStatus === "draft" ? { ids: [...selected] } : { action, ids: [...selected] }
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await response.json().catch(() => ({})) as { error?: string; message?: string }
      if (!response.ok) { setError(data.error ?? "The selected content could not be updated."); setConfirmOpen(false); return }
      setConfirmOpen(false); setSelected(new Set()); setError(null)
      setMessage(data.message ?? (action === "unschedule" ? "Scheduled content unscheduled." : "Selected content deleted."))
      router.refresh()
    })
  }

  const selectionLabel = selectedStatus === "scheduled" ? plural(selectedCount, "scheduled item") : plural(selectedCount, "Draft")
  return <>
    <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><ListChecks className="h-4 w-4 text-primary" /><span>Select draft or scheduled cards for their safe bulk controls.</span></div>
      <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={() => selectAllVisible("draft")} disabled={!drafts.length || (selectedStatus === "draft" && allVisibleSelected)}>Select all visible drafts</Button><Button type="button" size="sm" variant="outline" onClick={() => selectAllVisible("scheduled")} disabled={!scheduled.length || (selectedStatus === "scheduled" && allVisibleSelected)}>Select all visible scheduled</Button><Button type="button" size="sm" variant="ghost" onClick={() => { setSelected(new Set()); setError(null); setMessage(null) }} disabled={!selectedCount}>Clear selection</Button></div>
    </section>
    {selectedCount > 0 && <section className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${selectedStatus === "scheduled" ? "border-amber-300 bg-amber-50/60" : "border-destructive/30 bg-destructive/5"}`}><p className="text-sm font-medium">{selectionLabel} selected</p><div className="flex flex-wrap gap-2">{selectedStatus === "scheduled" && <Button type="button" size="sm" variant="outline" onClick={() => bulk("unschedule")} disabled={isPending}><CalendarX2 className="h-4 w-4" />Unschedule selected</Button>}<Button type="button" variant="destructive" size="sm" onClick={() => setConfirmOpen(true)} disabled={isPending}><Trash2 className="h-4 w-4" />{selectedStatus === "scheduled" ? `Delete ${plural(selectedCount, "item")}` : `Delete ${selectionLabel}`}</Button></div></section>}
    {error && <p className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}{message && <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{message}</p>}
    {content.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{content.map(item => {
      const selectable = item.status === "draft" || item.status === "scheduled"
      return <MarketingContentCard key={item.id} content={item} selection={{ checked: selected.has(item.id), disabled: !selectable, onCheckedChange: checked => toggle(item, checked) }} />
    })}</div> : <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">No content matches this view.</div>}
    <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title={selectedStatus === "scheduled" ? "Delete selected scheduled items?" : "Delete selected drafts?"} description={selectedStatus === "scheduled" ? `You are about to permanently delete ${plural(selectedCount, "scheduled Marketing item")}. Their queued publishing jobs will be cancelled. Marketing-generated derivative assets may be deleted where appropriate. Original CRM property images and videos will not be deleted.` : `You are about to permanently delete ${selectionLabel}. Generated Marketing assets associated with these drafts will also be removed where appropriate. Original CRM property images and videos will never be deleted.`} confirmLabel={selectedStatus === "scheduled" ? `Delete ${plural(selectedCount, "item")}` : `Delete ${selectionLabel}`} cancelLabel="Cancel" onConfirm={() => bulk("delete")} loading={isPending} />
  </>
}
