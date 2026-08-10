import Link from "next/link"
import { CalendarDays, CheckCircle2, CircleAlert, Clock3, Plus, Send, Sparkles } from "lucide-react"

import { MarketingContentCard } from "@/components/marketing/content-card"
import { MarketingAssistant } from "@/components/marketing/marketing-assistant"
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header"
import { requireMarketingAdminPage } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"
import { createServerSupabaseClient } from "@/lib/supabase/server"

const stats = [
  { key: "draft", label: "Drafts", icon: Sparkles, color: "text-primary" },
  { key: "ready_for_review", label: "Awaiting approval", icon: Clock3, color: "text-amber-600" },
  { key: "scheduled", label: "Scheduled", icon: CalendarDays, color: "text-violet-600" },
  { key: "published", label: "Published", icon: CheckCircle2, color: "text-emerald-600" },
] as const

export default async function MarketingOverviewPage() {
  await requireMarketingAdminPage()
  const [dashboard, supabase] = await Promise.all([
    MarketingRepository.getDashboardData(),
    createServerSupabaseClient(),
  ])
  const { data: properties } = await supabase
    .from("properties")
    .select("id, name")
    .order("created_at", { ascending: false })
    .limit(50)
  const accountHealth = dashboard.account?.status === "connected" || dashboard.account?.status === "expiring"

  return (
    <>
      <MarketingPageHeader
        pathname="/marketing"
        eyebrow="Private AI marketing studio"
        title="Create with intention. Publish with control."
        description="Turn the property inventory already in your CRM into review-ready Instagram content. Nothing is ever scheduled or published without your explicit approval."
        action={
          <div className="flex flex-wrap gap-2">
            <Link href="/marketing/campaigns" className="inline-flex h-10 items-center gap-2 rounded-lg border bg-background px-4 text-sm font-semibold hover:bg-muted"><CalendarDays className="h-4 w-4" />Create campaign</Link>
            <Link href="/marketing/create" className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90"><Plus className="h-4 w-4" />Create content</Link>
          </div>
        }
      />
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-7 p-4 sm:p-6 lg:p-8">
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(stat => {
            const Icon = stat.icon
            return <div key={stat.key} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between"><p className="text-sm text-muted-foreground">{stat.label}</p><Icon className={`h-5 w-5 ${stat.color}`} /></div>
              <p className="mt-3 text-3xl font-bold">{dashboard.counts[stat.key] ?? 0}</p>
            </div>
          })}
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-2xl border bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4"><div><h2 className="font-semibold">Recent creative work</h2><p className="mt-1 text-sm text-muted-foreground">Renders and drafts from your current inventory.</p></div><Link href="/marketing/content" className="text-sm font-semibold text-primary hover:underline">View library</Link></div>
            {dashboard.content.length ? <div className="mt-5 grid gap-4 sm:grid-cols-2">{dashboard.content.slice(0, 4).map(content => <MarketingContentCard key={content.id} content={content} />)}</div> : <div className="mt-5 rounded-xl border border-dashed p-8 text-center"><Sparkles className="mx-auto h-8 w-8 text-primary" /><h3 className="mt-3 font-semibold">Your studio is ready</h3><p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Choose a property and create your first review-ready Instagram asset.</p><Link href="/marketing/create" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Create content</Link></div>}
          </div>
          <aside className="space-y-5">
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-start gap-3"><div className={`rounded-xl p-2 ${accountHealth ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{accountHealth ? <CheckCircle2 className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}</div><div><p className="font-semibold">Instagram connection</p><p className="mt-1 text-sm text-muted-foreground">{accountHealth ? `Connected as @${dashboard.account?.username || "Instagram account"}` : "Connect a professional account before publishing."}</p></div></div>
              <Link href="/marketing/settings" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">{accountHealth ? "Connection settings" : "Connect Instagram"}</Link>
            </div>
            <div className="rounded-2xl bg-primary p-5 text-primary-foreground"><Send className="h-5 w-5 text-[color:var(--accent)]" /><h2 className="mt-4 font-semibold">Approval is your control point.</h2><p className="mt-2 text-sm leading-6 text-primary-foreground/80">AI can draft, render and prepare. Only you can approve content for the publishing queue.</p><Link href="/marketing/approvals" className="mt-4 inline-flex text-sm font-semibold text-[color:var(--accent)] hover:underline">Review approval queue</Link></div>
          </aside>
        </section>

        <MarketingAssistant properties={(properties ?? []).map(property => ({ id: property.id, name: property.name }))} />
      </div>
    </>
  )
}
