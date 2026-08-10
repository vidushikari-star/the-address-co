import { BarChart3 } from "lucide-react"

import { MarketingPageHeader } from "@/components/marketing/marketing-page-header"
import { requireMarketingAdminPage } from "@/lib/auth/marketing"

export default async function MarketingAnalyticsPage() {
  await requireMarketingAdminPage()
  return <><MarketingPageHeader pathname="/marketing/analytics" eyebrow="Analytics foundation" title="Performance data, only when Instagram provides it." description="The studio stores publishing history and is ready to ingest supported Instagram metrics without fabricating engagement or causal claims." /><main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8"><section className="rounded-2xl border border-dashed bg-card p-12 text-center"><BarChart3 className="mx-auto h-9 w-9 text-primary" /><h2 className="mt-4 font-semibold">Analytics sync is ready for the connected account</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Once a Meta professional account is connected and published content exists, the protected worker can collect the metrics that Meta authorizes for that account, including reach, plays and interactions where available.</p></section></main></>
}
