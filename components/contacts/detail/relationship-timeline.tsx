"use client"

import {
  Calendar,
  FileText,
  Home,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  CheckCircle2,
  ClipboardList,
  HandCoins,
  UserPlus,
} from "lucide-react"

import type { Contact } from "@/types/contact"
import type { Activity } from "@/types/activity"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const activityIcons = {
  contact_created: UserPlus,
  call: Phone,
  meeting: Calendar,
  site_visit: MapPin,
  email: Mail,
  whatsapp: MessageCircle,
  note: FileText,
  task_created: ClipboardList,
  task_completed: CheckCircle2,
  property_shared: Home,
  property_viewed: Home,
  offer_made: HandCoins,
  deal_stage_changed: HandCoins,
  deal_closed: CheckCircle2,
} satisfies Record<Activity["type"], React.ElementType>

type Props = {
  contact: Contact
}

export function RelationshipTimeline({
  contact,
}: Props) {
  const activities = contact.activities ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Activity Timeline
        </CardTitle>
      </CardHeader>

      <CardContent>
        {activities.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No activity yet.
          </div>
        ) : (
          <div className="space-y-6">
            {activities
              .slice()
              .sort(
  (a, b) =>
    new Date(
      b.date ?? b.createdAt
    ).getTime() -
    new Date(
      a.date ?? a.createdAt
    ).getTime()
)
              .map((activity) => {
                const Icon =
                  activityIcons[
                    activity.type as Activity["type"]
                  ] ?? FileText

                return (
                  <div
                    key={activity.id}
                    className="flex gap-4"
                  >
                    <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full border bg-background">
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {activity.title}
                        </h4>

                        <span className="text-xs text-muted-foreground">
                        {new Date(
  activity.date ?? activity.createdAt
).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}