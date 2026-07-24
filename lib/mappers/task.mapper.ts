import type { Task } from "@/types/task"


export function mapTaskRow(
  row: any
): Task {

  return {

    id:
      row.id,


    title:
      row.title ?? "",


    description:
      row.description ?? "",


    completed:
      row.status === "completed",


    status:
      row.status ?? "pending",


    priority:
      row.priority ?? "medium",


    dueDate:
      row.due_date
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