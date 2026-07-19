import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/ui/dashboard-card"

export function RelationshipNotes() {
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>
          Advisor Notes
        </DashboardCardTitle>
      </DashboardCardHeader>

      <DashboardCardContent className="space-y-4">
        <div className="rounded-xl border p-5">
          <p className="text-sm leading-7">
            Rajiv is purchasing a permanent family home.
            His wife has become actively involved in the
            decision-making process. Garden space and
            privacy have become higher priorities after the
            first site visit.
          </p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-sm leading-7">
            Strong interest in Casa Ekam. Arrange another
            viewing once revised pricing is available.
          </p>
        </div>
      </DashboardCardContent>
    </DashboardCard>
  )
}