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

// A task date is a calendar date, not an implicit midnight timestamp. Keeping
// it as YYYY-MM-DD prevents the familiar 05:30 IST rendering artefact.
dueDate?: string

// Optional local India time stored separately from the date. Existing tasks
// with no value are intentionally shown as date-only/all-day work.
dueTime?: string

assignedTo?: string

// Resolved from user_profiles at the repository boundary. Components must use
// this rather than rendering assignedTo, which is an internal UUID.
advisorName?: string

contactId?: string

dealId?: string

createdAt?: string

updatedAt?: string

}
