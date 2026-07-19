import {
  Building2,
  Clock3,
  Home,
  IndianRupee,
  MapPin,
  User,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/ui/dashboard-card"

type ItemProps = {
  icon: React.ReactNode
  label: string
  value: string
}

function SnapshotItem({
  icon,
  label,
  value,
}: ItemProps) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="mt-1 text-muted-foreground">
        {icon}
      </div>

      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>

        <p className="font-medium">
          {value}
        </p>
      </div>
    </div>
  )
}

export function RelationshipSnapshot() {
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>
          Client Snapshot
        </DashboardCardTitle>
      </DashboardCardHeader>

      <DashboardCardContent className="divide-y">
        <SnapshotItem
          icon={<IndianRupee className="h-4 w-4" />}
          label="Budget"
          value="₹12–15 Cr"
        />

        <SnapshotItem
          icon={<Home className="h-4 w-4" />}
          label="Property Type"
          value="Luxury Villa"
        />

        <SnapshotItem
          icon={<MapPin className="h-4 w-4" />}
          label="Preferred Areas"
          value="Assagao • Parra • Siolim"
        />

        <SnapshotItem
          icon={<Building2 className="h-4 w-4" />}
          label="Purpose"
          value="Primary Residence"
        />

        <SnapshotItem
          icon={<Clock3 className="h-4 w-4" />}
          label="Timeline"
          value="Within 6 Months"
        />

        <SnapshotItem
          icon={<User className="h-4 w-4" />}
          label="Relationship Owner"
          value="Vidushi Kari"
        />
      </DashboardCardContent>
    </DashboardCard>
  )
}