import type { Task } from "@/types/task"


export function mapTaskRow(
  row: any
): Task {

  return {

    id:
      row.id,

    title:
      row.title ?? "",

    completed:
      row.status === "completed",

    dueDate:
      row.due_date
        ? new Date(row.due_date)
        : undefined,

    assignedTo:
      row.assigned_to ?? "",

  }
}