import {
  Calendar,
  FileText,
  Phone,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/ui/dashboard-card"

import { ActivityGroup } from "@/components/shared/activity-group"
import { ActivityItem } from "@/components/shared/activity-item"

export function RelationshipTimeline() {
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>
          Relationship Timeline
        </DashboardCardTitle>
      </DashboardCardHeader>

      <DashboardCardContent className="space-y-10">
        <ActivityGroup title="Yesterday">
          <ActivityItem
            icon={<Phone className="h-4 w-4" />}
            title="18 minute discovery call"
            time="4:20 PM"
          >
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Budget increased to ₹15 Cr</li>
              <li>Looking for larger garden</li>
              <li>Wife joining next meeting</li>
            </ul>
          </ActivityItem>
        </ActivityGroup>

        <ActivityGroup title="Monday">
          <ActivityItem
            icon={<Calendar className="h-4 w-4" />}
            title="Site Visit — Casa Ekam"
            time="11:00 AM"
          >
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>Loved the layout</li>
              <li>Parking felt small</li>
              <li>Requested updated pricing</li>
            </ul>
          </ActivityItem>
        </ActivityGroup>

        <ActivityGroup title="Last Week">
          <ActivityItem
            icon={<FileText className="h-4 w-4" />}
            title="Brochure Shared"
            time="Friday"
          >
            <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
              <li>108 Horizon brochure sent</li>
              <li>Client viewed twice</li>
            </ul>
          </ActivityItem>
        </ActivityGroup>
      </DashboardCardContent>
    </DashboardCard>
  )
}