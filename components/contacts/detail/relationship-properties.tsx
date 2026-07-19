import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  XCircle,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/ui/dashboard-card"

type PropertyJourney = {
  id: number
  property: string
  status: "Shortlisted" | "Viewed" | "Rejected" | "Site Visit"
  note: string
}

const properties: PropertyJourney[] = [
  {
    id: 1,
    property: "Casa Ekam",
    status: "Shortlisted",
    note: "Loved the layout. Awaiting revised pricing.",
  },
  {
    id: 2,
    property: "108 Horizon",
    status: "Rejected",
    note: "Prefers a villa over an apartment.",
  },
  {
    id: 3,
    property: "Alma & Forma",
    status: "Viewed",
    note: "Pool felt too compact.",
  },
  {
    id: 4,
    property: "Villa Aurelia",
    status: "Site Visit",
    note: "Visit scheduled for tomorrow.",
  },
]

function StatusIcon({
  status,
}: {
  status: PropertyJourney["status"]
}) {
  switch (status) {
    case "Shortlisted":
      return <CheckCircle2 className="h-5 w-5 text-emerald-600" />

    case "Rejected":
      return <XCircle className="h-5 w-5 text-red-500" />

    case "Site Visit":
      return <Calendar className="h-5 w-5 text-blue-600" />

    default:
      return <Clock3 className="h-5 w-5 text-amber-500" />
  }
}

export function RelationshipProperties() {
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>
          Property Journey
        </DashboardCardTitle>
      </DashboardCardHeader>

      <DashboardCardContent className="space-y-5">
        {properties.map((property) => (
          <div
            key={property.id}
            className="flex items-start gap-4 rounded-2xl border p-5 transition-colors hover:bg-muted/30"
          >
            <StatusIcon status={property.status} />

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">
                  {property.property}
                </h4>

                <ArrowRight className="h-3 w-3 text-muted-foreground" />

                <span className="text-sm text-muted-foreground">
                  {property.status}
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {property.note}
              </p>
            </div>
          </div>
        ))}
      </DashboardCardContent>
    </DashboardCard>
  )
}