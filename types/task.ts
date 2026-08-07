export type TaskPriority =
| "low"
| "medium"
| "high"


export interface Task {

id: string

title: string

description?: string

completed: boolean

archived: boolean

status:
| "pending"
| "completed"

priority: TaskPriority

dueDate?: Date

assignedTo?: string

contactId?: string

dealId?: string

createdAt?: string

updatedAt?: string

}