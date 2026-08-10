"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { ListChecks, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"

import { MarketingContentCard } from "@/components/marketing/content-card"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { MarketingContent } from "@/lib/marketing/types"

function draftLabel(count: number) {
  return `${count} Draft${count === 1 ? "" : "s"}`
}

export function MarketingContentLibrary({ content }: { content: MarketingContent[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(() => new Set())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const drafts = useMemo(() => content.filter(item => item.status === "draft"), [content])
  const draftIds = useMemo(() => new Set(drafts.map(item => item.id)), [drafts])
  const selectedCount = selected.size
  const allVisibleDraftsSelected = drafts.length > 0 && drafts.every(item => selected.has(item.id))

  useEffect(() => {
    setSelected(current => new Set([...current].filter(id => draftIds.has(id))))
  }, [draftIds])

  function toggle(id: string, checked: boolean) {
    setSelected(current => {
      const next = new Set(current)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function selectAllVisibleDrafts() {
    setSelected(new Set(drafts.map(item => item.id)))
    setError(null)
  }

  function deleteSelected() {
    startTransition(async () => {
      const response = await fetch("/api/marketing/content/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selected] }),
      })
      const data = await response.json().catch(() => ({})) as { error?: string; count?: number }
      if (!response.ok) {
        setError(data.error ?? "The selected drafts could not be deleted.")
        setConfirmOpen(false)
        return
      }
      setConfirmOpen(false)
      setSelected(new Set())
      setError(null)
      router.refresh()
    })
  }

  return <>
    <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground"><ListChecks className="h-4 w-4 text-primary" /><span>Select draft cards to delete them in one action.</span></div>
      <div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" onClick={selectAllVisibleDrafts} disabled={!drafts.length || allVisibleDraftsSelected}>Select all visible drafts</Button><Button type="button" size="sm" variant="ghost" onClick={() => { setSelected(new Set()); setError(null) }} disabled={!selectedCount}>Clear selection</Button></div>
    </section>
    {selectedCount > 0 && <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"><p className="text-sm font-medium">{draftLabel(selectedCount)} selected</p><Button type="button" variant="destructive" size="sm" onClick={() => setConfirmOpen(true)} disabled={isPending}><Trash2 className="h-4 w-4" />Delete {draftLabel(selectedCount)}</Button></section>}
    {error && <p className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {content.length ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{content.map(item => {
      const deletable = item.status === "draft"
      return <MarketingContentCard key={item.id} content={item} selection={{ checked: selected.has(item.id), disabled: !deletable, onCheckedChange: checked => toggle(item.id, checked) }} />
    })}</div> : <div className="rounded-2xl border border-dashed bg-card p-12 text-center text-sm text-muted-foreground">No content matches this view.</div>}
    <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="Delete selected drafts?" description={`You are about to permanently delete ${draftLabel(selectedCount)}. Generated Marketing assets associated with these drafts will also be removed where appropriate. Original CRM property images and videos will never be deleted.`} confirmLabel={`Delete ${draftLabel(selectedCount)}`} cancelLabel="Cancel" onConfirm={deleteSelected} loading={isPending} />
  </>
}
