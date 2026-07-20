import type { Contact } from "./contact"
import type { Property } from "./property"

export type DealStage =
  | "lead"
  | "qualification"
  | "property_shared"
  | "site_visit"
  | "negotiation"
  | "documentation"
  | "closed_won"
  | "closed_lost"

export interface DealValue {
  propertyPrice: number
  commissionPercentage: number
  commissionAmount: number
}

export interface Deal {
  id: string

  name: string

  stage: DealStage

  contactId: string

  propertyId: string

  advisor: string

  value: DealValue

  expectedCloseDate?: string

  probability: number

  notes?: string[]

  createdAt: string

  updatedAt: string

  priority: "low" | "medium" | "high"

tasks: string[]

lastActivity: string
}