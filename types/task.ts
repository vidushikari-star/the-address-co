export interface Task {

  id: string

  title: string

  description?: string

  completed: boolean

  status:
    | "pending"
    | "completed"

  priority:
    | "low"
    | "medium"
    | "high"

  dueDate?: Date

  assignedTo?: string

  contactId?: string

  dealId?: string

  createdAt?: string

  updatedAt?: string

}