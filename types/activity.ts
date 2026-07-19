export type ActivityType =
  | "call"
  | "meeting"
  | "site_visit"
  | "note"
  | "email"
  | "whatsapp"
  | "property_shared"

export interface Activity {
  id: string

  type: ActivityType

  title: string

  // Used throughout the CRM timeline
  summary?: string

  // Temporary compatibility with existing mock data
  description?: string

  createdAt: Date

  createdBy: string

  contactId?: string

  propertyId?: string
}