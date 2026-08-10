import { ApprovalActions } from "@/components/marketing/approval-actions"
import { MarketingContentCard } from "@/components/marketing/content-card"
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header"
import { requireMarketingAdminPage } from "@/lib/auth/marketing"
import { MarketingRepository } from "@/lib/marketing/repositories/marketing-repository"

export default async function MarketingApprovalsPage() {
  await requireMarketingAdminPage()
  const content = [
    ...(await MarketingRepository.listContent({ status: "ready_for_review" })),
    ...(await MarketingRepository.listContent({ status: "changes_requested" })),
  ]
  return <><MarketingPageHeader pathname="/marketing/approvals" eyebrow="Approval queue" title="You are the final approval authority." description="Review the finished media, caption and metadata before content is allowed into the scheduling or publishing queue." /><main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">{content.length ? <div className="grid gap-5 lg:grid-cols-2">{content.map(item => <div key={item.id} className="rounded-2xl border bg-card p-4 sm:p-5"><MarketingContentCard content={item} /><div className="mt-4 border-t pt-4"><p className="mb-3 text-sm text-muted-foreground">{item.hashtags.join(" ")}</p><ApprovalActions contentId={item.id} /></div></div>)}</div> : <div className="rounded-2xl border border-dashed bg-card p-12 text-center"><h2 className="font-semibold">Nothing needs your approval</h2><p className="mt-2 text-sm text-muted-foreground">Rendered drafts will appear here. AI cannot move content through this queue.</p></div>}</main></>
}
