"use client"

import { useState } from "react"

import {
  housingListingContactFromPayload,
  maskHousingListingPhone,
  type HousingInventoryInboxRow,
} from "@/lib/integrations/housing/inventory"

type Props = {
  configured: boolean
  submissions: HousingInventoryInboxRow[]
  loadError?: boolean
}

function submissionSummary(submission: HousingInventoryInboxRow) {
  const payload = submission.payload as Record<string, unknown>
  const address = payload.address as Record<string, unknown> | undefined
  const contact = housingListingContactFromPayload(payload)
  return {
    propertyName: typeof payload.building_or_society_name === "string" ? payload.building_or_society_name : "Unnamed listing",
    locality: typeof address?.locality === "string" ? address.locality : "—",
    city: typeof address?.city === "string" ? address.city : "",
    contactName: contact?.name ?? "No listing contact",
    contactPhone: maskHousingListingPhone(contact?.phone),
    contactEmail: contact?.email ?? "—",
  }
}

function statusLabel(status: HousingInventoryInboxRow["status"]) {
  return status === "ready_for_mapping" ? "Ready for Mapping" : status.replaceAll("_", " ")
}

export function HousingInventoryInbox({ configured, submissions, loadError }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(submissions[0]?.id ?? null)
  const selected = submissions.find(submission => submission.id === selectedId) ?? submissions[0]

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-card p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold">Housing Inventory Integration</h2>
            <p className="mt-1 text-sm text-muted-foreground">Phase 1 securely stores Housing submissions for review. It does not create or update CRM properties.</p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${configured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
            {configured ? "Configured" : "Not configured"}
          </span>
        </div>
        {!configured && <p className="mt-4 rounded-lg bg-muted p-3 text-sm text-muted-foreground">Set <code>HOUSING_INVENTORY_API_KEY</code> and the server-only Supabase service-role key in Vercel Production before sharing the endpoint.</p>}
      </section>

      <section className="overflow-hidden rounded-2xl border bg-card">
        <div className="border-b p-5"><h2 className="font-semibold">Recent submissions</h2><p className="mt-1 text-sm text-muted-foreground">Latest payload version per Housing external ID.</p></div>
        {loadError ? <p className="p-6 text-sm text-destructive">Submissions could not be loaded. The intake endpoint remains isolated from CRM properties.</p> : submissions.length === 0 ? <p className="p-10 text-center text-sm text-muted-foreground">No Housing inventory submissions yet.</p> : (
          <div className="grid lg:grid-cols-[1.15fr_0.85fr]">
            <div className="overflow-x-auto border-b lg:border-b-0 lg:border-r">
              <table className="w-full min-w-[940px] text-sm">
                <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="p-4">External ID</th><th className="p-4">Property / project</th><th className="p-4">Listing contact</th><th className="p-4">Locality</th><th className="p-4">Status</th><th className="p-4">Version</th><th className="p-4">Received</th></tr></thead>
                <tbody>{submissions.map(submission => {
                  const summary = submissionSummary(submission)
                  return <tr key={submission.id} className={`cursor-pointer border-t hover:bg-muted/50 ${selected?.id === submission.id ? "bg-primary/5" : ""}`} onClick={() => setSelectedId(submission.id)}>
                    <td className="p-4 font-mono text-xs font-medium">{submission.external_id}</td>
                    <td className="p-4"><p className="font-medium">{summary.propertyName}</p></td>
                    <td className="p-4"><p className="font-medium">{summary.contactName}</p><p className="text-xs text-muted-foreground">{summary.contactPhone} · {summary.contactEmail}</p></td>
                    <td className="p-4">{summary.locality}{summary.city ? `, ${summary.city}` : ""}</td>
                    <td className="p-4"><span className={`rounded-full px-2 py-1 text-xs font-medium ${submission.status === "invalid" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>{statusLabel(submission.status)}</span></td>
                    <td className="p-4">v{submission.version}</td>
                    <td className="p-4 whitespace-nowrap text-muted-foreground">{new Date(submission.received_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</td>
                  </tr>
                })}</tbody>
              </table>
            </div>
            {selected && <aside className="space-y-4 p-5">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Submission</p><p className="mt-1 font-mono text-sm">{selected.external_id}</p></div>
              {(() => {
                const summary = submissionSummary(selected)
                return <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Listing contact</p><p className="mt-1 text-sm font-medium">{summary.contactName}</p><p className="text-sm text-muted-foreground">{summary.contactPhone}</p><p className="text-sm text-muted-foreground">{summary.contactEmail}</p></div>
              })()}
              <div><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Validation</p>{selected.validation_errors.length ? <ul className="mt-2 space-y-2 text-sm text-destructive">{selected.validation_errors.map(item => <li key={`${item.field}-${item.message}`}><span className="font-medium">{item.field}:</span> {item.message}</li>)}</ul> : <p className="mt-1 text-sm text-emerald-700">Validated; ready for phase-2 mapping.</p>}</div>
              <details><summary className="cursor-pointer text-sm font-medium text-primary">Inspect normalized submission (admin only)</summary><pre className="mt-3 max-h-96 overflow-auto rounded-lg bg-muted p-3 text-xs leading-5">{JSON.stringify(selected.payload, null, 2)}</pre></details>
            </aside>}
          </div>
        )}
      </section>
    </div>
  )
}
