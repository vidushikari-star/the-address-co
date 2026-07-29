import type { Task } from "@/types/task"

type TaskRow = {
  id: string
  title: string | null
  description: string | null
  status: Task["status"] | null
  priority: Task["priority"] | null
  due_date: string | null
  assigned_to: string | null
  contact_id: string | null
  deal_id: string | null
  created_at: string | null
  updated_at: string | null
}

export function mapTaskRow(
  row: TaskRow
): Task {
  return {
    id: row.id,

    title: row.title ?? "",

    description: row.description ?? "",

    completed: row.status === "completed",

    status: row.status ?? "pending",

    priority: row.priority ?? "medium",

    dueDate: row.due_date
      ? new Date(row.due_date)
      : undefined,

    assignedTo:
      row.assigned_to ?? "",

    contactId:
      row.contact_id ?? undefined,

    dealId:
      row.deal_id ?? undefined,

    createdAt:
      row.created_at ?? undefined,

    updatedAt:
      row.updated_at ?? undefined,
  }
}