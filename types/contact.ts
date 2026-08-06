import type { Activity } from "@/types/activity"
import type { Note } from "@/types/note"
import type { Task } from "@/types/task"

export type ContactStage =
  | "new"
  | "contacted"
  | "qualified"
  | "active"
  | "viewing"
  | "negotiating"
  | "won"
  | "lost"
  | "inactive"

export type PreferredCommunication =
  | "call"
  | "whatsapp"
  | "email"

export type PropertyTypePreference =
  | "apartment"
  | "villa"
  | "plot"
  | "commercial"

export type PurchasePurpose =
  | "self_use"
  | "holiday_home"
  | "investment"

export type FinancingPreference =
  | "cash"
  | "loan"
  | "both"

export type LeadSource =
  | "instagram"
  | "housing"
  | "magicbricks"
  | "99acres"
  | "website"
  | "whatsapp"
  | "referral"
  | "walk_in"
  | "existing_client"
  | "broker"
  | "other"


export interface BuyerProfile {
  nationality?: string

  city?: string

  countryOfResidence?: string

  occupation?: string

  company?: string

  preferredCommunication?: PreferredCommunication

  requirements?: BuyerRequirements
}


export type MoveInPreference =
  | "ready"
  | "under_construction"
  | "both"

export type FurnishingPreference =
  | "furnished"
  | "semi_furnished"
  | "unfurnished"
  | "doesnt_matter"
export interface BuyerRequirements {
  budget: {
    min?: number
    max?: number
  }

  preferredLocations: string[]

  propertyTypes: PropertyTypePreference[]

  bedrooms?: number

  lookingFor?: MoveInPreference

  purpose?: PurchasePurpose

  developerPreference?: string

    furnishing?: FurnishingPreference

  financing?: FinancingPreference

  timeline?: string

  minimumCarpetArea?: number

  privatePool?: boolean

  gatedCommunity?: boolean

  seaView?: boolean

  riverView?: boolean

  petFriendly?: boolean

  staffQuarters?: boolean
}


export interface LeadInformation {
  source?: LeadSource

  referredBy?: string

  assignedAdvisor?: string

  status?: string
}



export interface Contact {
  id: string

  name: string

  firstName?: string

  lastName?: string

  phone: string

  whatsapp?: string

  email?: string

  city?: string

  country?: string

  preferredLanguage?: string

  stage: ContactStage

  assignedAdvisor?: string

  buyerProfile?: BuyerProfile

  buyerRequirements?: BuyerRequirements

  leadInformation?: LeadInformation

  propertyIds: string[]

  activities: Activity[]

  tasks: Task[]

  notes: Note[]

  deals: string[]

  // CRM fields

  relationshipTypes?: string[]

  budgetMin?: number

  budgetMax?: number

  currency?: string

  purpose?: PurchasePurpose

  financing?: FinancingPreference

  resident?: string

  intent?: 
  "sale"
  | "rental"
  | "both"

  propertyType?: string

  propertyTypes?: PropertyTypePreference[]

  locations?: string[]

  minArea?: number

  maxArea?: number

  plotSize?: number

  bathrooms?: number

  mustHave?: string[]

  niceToHave?: string[]

  spouseName?: string

  coBuyer?: string

  referralSource?: string

  notesText?: string

  privateNotes?: string

  timeline?: string

  leadSource?: LeadSource

  nextFollowUpAt?: string

  lastActivityAt?: string

  createdAt?: string

    housingLeadId?: string


  // legacy/mock compatibility

  avatar?: string

  type?: string

  budget?: {
    min?: number
    max?: number
  }

  preferredLocations?: string[]

  bedrooms?: number

  advisor?: string

  source?: string

  preferredAreas?: string[]
}