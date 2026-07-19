import type { Activity } from "./activity"
import type { Deal } from "./deal"
import type { Note } from "./note"
import type { Property } from "./property"
import type { Task } from "./task"

export type ContactType =
  | "buyer"
  | "seller"
  | "investor"
  | "developer"
  | "partner"

export type ContactStage =
  | "new"
  | "contacted"
  | "qualified"
  | "site_visit"
  | "negotiation"
  | "closed"
  | "lost"

export type ContactPriority =
  | "High"
  | "Medium"
  | "Low"

export type PreferredPropertyType =
  | "Apartment"
  | "Villa"
  | "Plot"
  | "Penthouse"
  | "Commercial"

export interface ContactBudget {
  min: number
  max: number
}

export interface Contact {
  id: string

  // Core
  firstName?: string
  lastName?: string
  name: string

  email?: string
  phone?: string
  company?: string

  type: ContactType
  stage: ContactStage
  priority?: ContactPriority

  // Budget
  budget: ContactBudget
  budgetMin?: number
  budgetMax?: number

  // Preferences
  preferredAreas?: string[]
  preferredLocations: string[]

  propertyTypes: PreferredPropertyType[]

  bedrooms: number[]
  bathrooms?: number[]

  minArea?: number
  maxArea?: number

  timeline?: string

  // CRM
  advisor?: string
  assignedTo?: string
  source?: string

  nextMeeting?: string

  createdAt?: Date
  updatedAt?: Date

  activities?: Activity[]
  notes?: Note[]
  tasks?: Task[]
  deals?: Deal[]
  properties?: Property[]
}