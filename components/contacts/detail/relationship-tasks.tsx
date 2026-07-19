import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Phone,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/ui/dashboard-card"

type Task = {
  id: number
  title: string
  due: string
  completed: boolean
  icon: React.ReactNode
}

const tasks: Task[] = [
  {
    id: 1,
    title: "Call Rajiv regarding revised pricing",
    due: "Tomorrow • 11:00 AM",
    completed: false,
    icon: <Phone className="h-4 w-4" />,
  },
  {
    id: 2,
    title: "Schedule architect meeting",
    due: "Friday",
    completed: false,
    icon: <CalendarClock className="h-4 w-4" />,
  },
  {
    id: 3,
    title: "Send Casa Ekam brochure",
    due: "Completed",
    completed: true,
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
]

export function RelationshipTasks() {
  return (
    <DashboardCard>
      <DashboardCardHeader>
        <DashboardCardTitle>
          Next Actions
        </DashboardCardTitle>
      </DashboardCardHeader>

      <DashboardCardContent className="space-y-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-4 rounded-xl border p-4 transition-colors hover:bg-muted/40"
          >
            <div className="mt-1 text-muted-foreground">
              {task.completed ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : (
                <Circle className="h-5 w-5" />
              )}
            </div>

            <div className="flex-1">
              <p
                className={`font-medium ${
                  task.completed
                    ? "text-muted-foreground line-through"
                    : ""
                }`}
              >
                {task.title}
              </p>

              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                {task.icon}
                {task.due}
              </div>
            </div>
          </div>
        ))}
      </DashboardCardContent>
    </DashboardCard>
  )
}