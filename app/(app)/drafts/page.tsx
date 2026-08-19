"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  listCrmDrafts,
  type CrmDraft,
  type CrmDraftWorkflow,
} from "@/lib/repositories/crm-draft-repository"
import { formatIndiaDateTime } from "@/lib/utils/india-date"

const workflowDetails: Record<CrmDraftWorkflow, { label: string; href: string }> = {
  property: { label: "Property", href: "/dashboard?new=property" },
  relationship: { label: "Relationship", href: "/dashboard?new=relationship" },
  deal: { label: "Deal", href: "/dashboard?new=deal" },
}

export default function CrmDraftsPage() {
  const [drafts, setDrafts] = useState<CrmDraft[]>([])
  const [workflow, setWorkflow] = useState<CrmDraftWorkflow | "all">("all")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listCrmDrafts()
      .then(setDrafts)
      .catch(() => setError("Unable to load your drafts."))
      .finally(() => setLoading(false))
  }, [])

  const visibleDrafts = useMemo(
    () => workflow === "all" ? drafts : drafts.filter((draft) => draft.workflow === workflow),
    [drafts, workflow],
  )

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <p className="text-sm text-muted-foreground">Saved partial CRM work</p>
        <h1 className="text-3xl font-semibold">Drafts</h1>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
        <p className="text-sm text-muted-foreground">Drafts are private to you and resume in their original workflow.</p>
        <label className="text-sm font-medium">Filter <select value={workflow} onChange={(event) => setWorkflow(event.target.value as CrmDraftWorkflow | "all")} className="ml-2 rounded-md border bg-background px-2 py-1.5"><option value="all">All drafts</option><option value="property">Properties</option><option value="relationship">Relationships</option><option value="deal">Deals</option></select></label>
      </div>

      {loading ? <p className="rounded-xl border p-8 text-center text-sm text-muted-foreground">Loading drafts…</p> : error ? <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</p> : visibleDrafts.length ? <section className="space-y-3">{visibleDrafts.map((draft) => {
        const detail = workflowDetails[draft.workflow]
        return <article key={draft.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4"><div><div className="flex items-center gap-2"><h2 className="font-medium">{detail.label}</h2><Badge variant="secondary">Draft</Badge></div><p className="mt-1 text-sm text-muted-foreground">Last edited {formatIndiaDateTime(draft.updatedAt)}</p></div><Link href={detail.href} className={buttonVariants()}>Resume edit</Link></article>
      })}</section> : <p className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">No {workflow === "all" ? "saved" : workflow} drafts yet.</p>}
    </main>
  )
}
