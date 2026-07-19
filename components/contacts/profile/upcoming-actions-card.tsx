import {
  CalendarDays,
  CheckCircle2,
  Clock3,
} from "lucide-react"

import { ProfileCard } from "@/components/profile/profile-card"

const actions = [
  {
    title: "Schedule second site visit",
    due: "Tomorrow • 11:00 AM",
    completed: false,
  },
  {
    title: "Share revised pricing",
    due: "Friday",
    completed: false,
  },
  {
    title: "Collect feedback from spouse",
    due: "Completed",
    completed: true,
  },
]

export function UpcomingActionsCard() {
  return (
    <ProfileCard
      title="Upcoming Actions"
      description="Next steps for this relationship"
    >
      <div className="space-y-4">
        {actions.map((action) => (
          <div
            key={action.title}
            className="flex items-start gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4"
          >
            {action.completed ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
            ) : (
              <Clock3 className="mt-0.5 h-5 w-5 text-muted-foreground" />
            )}

            <div className="flex-1">
              <h3 className="font-medium">
                {action.title}
              </h3>

              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="h-4 w-4" />

                <span>{action.due}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ProfileCard>
  )
}