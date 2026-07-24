export type ActivityType =
  | "contact_created"
  | "call"
  | "meeting"
  | "site_visit"
  | "email"
  | "whatsapp"
  | "note"
  | "task_created"
  | "task_completed"
  | "task_removed"
  | "property_shared"
  | "property_viewed"
  | "offer_made"
  | "deal_stage_changed"
  | "lead_stage_changed"
  | "deal_closed"
    | "commission"
    | "commission_received"
  


export interface Activity {

  id: string

  type: ActivityType

  title: string

  description?: string

  body?: string

  date?: string

  createdAt: Date

  createdBy?: string

  userId?: string

  contactId?: string

  propertyId?: string

  dealId?: string

}