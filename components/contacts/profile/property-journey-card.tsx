import {
  ArrowUpRight,
  CircleCheck,
  Clock3,
  XCircle,
} from "lucide-react"

import { ProfileCard } from "@/components/profile/profile-card"

const properties = [
  {
    id: 1,
    name: "Casa Verde",
    price: "₹12.5 Cr",
    status: "Top Choice",
    note: "Visited twice • Offer expected",
  },
  {
    id: 2,
    name: "108 Horizon",
    price: "₹9.8 Cr",
    status: "Interested",
    note: "Requested revised pricing",
  },
  {
    id: 3,
    name: "Villa Aurora",
    price: "₹14 Cr",
    status: "Rejected",
    note: "Too far from school",
  },
]

function StatusIcon({
  status,
}: {
  status: string
}) {
  switch (status) {
    case "Top Choice":
      return (
        <CircleCheck className="h-5 w-5 text-green-600" />
      )

    case "Interested":
      return (
        <Clock3 className="h-5 w-5 text-amber-600" />
      )

    default:
      return (
        <XCircle className="h-5 w-5 text-muted-foreground" />
      )
  }
}

export function PropertyJourneyCard() {
  return (
    <ProfileCard
      title="Property Journey"
      description="Properties shared with the client"
    >
      <div className="space-y-4">
        {properties.map((property) => (
          <button
            key={property.id}
            className="group flex w-full items-center justify-between rounded-2xl border border-border/60 bg-muted/20 p-4 text-left transition-all duration-200 hover:border-primary/20 hover:bg-background"
          >
            <div className="flex gap-4">
              <StatusIcon status={property.status} />

              <div>
                <h3 className="font-medium">
                  {property.name}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  {property.price}
                </p>

                <p className="mt-2 text-sm">
                  {property.note}
                </p>
              </div>
            </div>

            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>
    </ProfileCard>
  )
}