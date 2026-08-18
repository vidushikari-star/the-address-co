import type { Task } from "@/types/task"

type TaskRow = {

id: string

title: string | null

description: string | null

status: Task["status"] | null

priority: Task["priority"] | null

archived: boolean | null

due_date: string | null

due_time?: string | null

advisor?: {
  name?: string | null
} | null

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

    archived:
  row.archived ?? false,

    status: row.status ?? "pending",

    priority: row.priority ?? "medium",

    dueDate: row.due_date ?? undefined,

    dueTime:
      row.due_time ?? undefined,

    assignedTo:
      row.assigned_to ?? "",

    advisorName:
      row.advisor?.name ?? undefined,

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
