import Link from "next/link"

import { getActivityActors, getActivityHistory, type ActivityEntity } from "@/lib/repositories/activity-history-server-repository"
import { formatIndiaDateTime } from "@/lib/utils/india-date"

type Props = {
  searchParams: Promise<{
    type?: string
    actor?: string
    entity?: ActivityEntity
    id?: string
    from?: string
    to?: string
    page?: string
  }>
}

export const dynamic = "force-dynamic"

export default async function ActivitiesPage({ searchParams }: Props) {
  const params = await searchParams
  const filters = {
    type: params.type,
    actorId: params.actor,
    entity: ["contact", "deal", "property"].includes(params.entity ?? "") ? params.entity : undefined,
    entityId: params.id,
    from: params.from,
    to: params.to,
    page: Number(params.page ?? "1") || 1,
  }
  const [{ items, total, page, pageSize }, actors] = await Promise.all([
    getActivityHistory(filters),
    getActivityActors(),
  ])
  const nextParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "page") nextParams.set(key, value)
  })
  const previousHref = page > 1 ? `/activities?${new URLSearchParams({ ...Object.fromEntries(nextParams), page: String(page - 1) })}` : null
  const nextHref = page * pageSize < total ? `/activities?${new URLSearchParams({ ...Object.fromEntries(nextParams), page: String(page + 1) })}` : null

  return <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
    <div><p className="text-sm text-muted-foreground">CRM audit trail</p><h1 className="text-3xl font-semibold">Activity History</h1><p className="mt-1 text-sm text-muted-foreground">{total} recorded activities, newest first.</p></div>
    <form className="grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-5">
      <select name="type" defaultValue={params.type ?? ""} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All activity types</option><option value="note">Notes</option><option value="call">Calls</option><option value="meeting">Meetings</option><option value="site_visit">Site visits</option><option value="task_created">Tasks created</option><option value="task_completed">Tasks completed</option><option value="property_shared">Properties shared</option><option value="deal_stage_changed">Deal changes</option><option value="lead_stage_changed">Lead changes</option></select>
      <select name="actor" defaultValue={params.actor ?? ""} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All users</option>{actors.map(actor => <option key={actor.id} value={actor.id}>{actor.full_name ?? "Unknown user"}</option>)}</select>
      <select name="entity" defaultValue={params.entity ?? ""} className="rounded-md border bg-background px-3 py-2 text-sm"><option value="">All entities</option><option value="contact">Contacts</option><option value="deal">Deals</option><option value="property">Properties</option></select>
      <input name="from" type="date" defaultValue={params.from} className="rounded-md border bg-background px-3 py-2 text-sm" aria-label="From date" />
      <div className="flex gap-2"><input name="to" type="date" defaultValue={params.to} className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm" aria-label="To date" /><button className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Filter</button></div>
    </form>
    <section className="divide-y overflow-hidden rounded-xl border bg-card">
      {items.length ? items.map(activity => <article key={activity.id} className="space-y-2 p-4"><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-medium"><span className="text-primary">{activity.actorName}</span> · {activity.title}</p><time className="text-xs text-muted-foreground">{formatIndiaDateTime(activity.date ?? activity.createdAt.toISOString())}</time></div>{activity.description && <p className="text-sm text-muted-foreground">{activity.description}</p>}{activity.body && <p className="text-sm text-muted-foreground">{activity.body}</p>}{activity.entity && <Link href={activity.entity.href} className="text-xs font-medium text-primary hover:underline">{activity.entity.type}: {activity.entity.label}</Link>}</article>) : <p className="p-8 text-center text-sm text-muted-foreground">No activities match these filters.</p>}
    </section>
    <nav className="flex justify-between gap-3">{previousHref ? <Link href={previousHref} className="rounded-md border px-3 py-2 text-sm">Previous</Link> : <span />}{nextHref && <Link href={nextHref} className="rounded-md border px-3 py-2 text-sm">Next</Link>}</nav>
  </main>
}
