import { getDeals } from "@/lib/repositories/deal-repository"

import { DealPipeline } from "@/components/deals/deal-pipeline"

export default function DealsPage() {
  const deals = getDeals()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Deals
          </h1>

          <p className="text-muted-foreground">
            Manage your sales pipeline.
          </p>
        </div>
      </div>

      <DealPipeline deals={deals} />
    </div>
  )
}