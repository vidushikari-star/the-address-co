import { cn } from "@/lib/utils"
import type { MarketingStatus } from "@/lib/marketing/types"

const labels: Record<MarketingStatus, string> = {
  draft: "Draft",
  rendering: "Rendering",
  ready_for_review: "Awaiting approval",
  changes_requested: "Changes requested",
  approved: "Approved",
  scheduled: "Scheduled",
  publishing: "Publishing",
  published: "Published",
  blocked_connection: "Reconnect Instagram",
  failed: "Failed",
}

export function MarketingStatusPill({ status }: { status: MarketingStatus }) {
  return (
    <span className={cn(
      "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold",
      status === "published" && "bg-emerald-100 text-emerald-800",
      status === "approved" && "bg-sky-100 text-sky-800",
      status === "scheduled" && "bg-violet-100 text-violet-800",
      status === "ready_for_review" && "bg-amber-100 text-amber-800",
      status === "blocked_connection" && "bg-amber-100 text-amber-800",
      status === "failed" && "bg-red-100 text-red-800",
      ["draft", "rendering", "changes_requested", "publishing"].includes(status) && "bg-muted text-muted-foreground"
    )}>
      {labels[status]}
    </span>
  )
}
