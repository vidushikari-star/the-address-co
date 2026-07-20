"use client"

import type { Contact } from "@/types"

import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Plus,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

type RelationshipTasksProps = {
  contact: Contact
}

type Task = {
  id: number
  title: string
  due: string
  priority: keyof typeof badgeVariant
  completed: boolean
}

const badgeVariant = {
  High: "destructive",
  Medium: "secondary",
  Low: "outline",
  Done: "default",
} as const

const tasks: Task[] = [
  {
    id: 1,
    title: "Schedule site visit",
    due: "Today • 4:00 PM",
    priority: "High",
    completed: false,
  },
  {
    id: 2,
    title: "Share updated payment plan",
    due: "Tomorrow",
    priority: "Medium",
    completed: false,
  },
  {
    id: 3,
    title: "Follow up after meeting",
    due: "Friday",
    priority: "Low",
    completed: false,
  },
  {
    id: 4,
    title: "Sent brochure",
    due: "Completed",
    priority: "Done",
    completed: true,
  },
]

export function RelationshipTasks({
  contact: _contact,
}: RelationshipTasksProps) {
  const pending = tasks.filter((task) => !task.completed)
  const completed = tasks.filter((task) => task.completed)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks</CardTitle>

        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Upcoming
          </p>

          <div className="space-y-3">
            {pending.map((task) => (
              <div
                key={task.id}
                className="rounded-lg border p-3 transition-colors hover:bg-muted/40"
              >
                <div className="flex items-start gap-3">
                  <Checkbox />

                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">
                        {task.title}
                      </p>

                      <Badge variant={badgeVariant[task.priority]}>
                        {task.priority}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {task.due}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {completed.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Completed
            </p>

            <div className="space-y-3">
              {completed.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg border bg-muted/30 p-3"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />

                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground line-through">
                        {task.title}
                      </p>
                    </div>

                    <Circle className="h-3 w-3 fill-current text-green-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}