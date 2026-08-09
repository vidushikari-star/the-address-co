export interface CreateContactDto {

  fullName: string

  phone: string

  email?: string

  city?: string

  country?: string

  whatsapp?: string

  preferredLanguage?: string

  leadSource?: string


  intent?:
    | "sale"
    | "rental"
    | "both"


  relationshipTypes?: string[]


  assignedAdvisor?: string

  advisor?: string


  budgetMin?: number

  budgetMax?: number


  currency?: string


  purpose?: string


  timeline?: string


  financing?: string


  resident?: string


  propertyType?: string


  bedrooms?: string

  bathrooms?: number


  locations?: string[]


  minArea?: number

  maxArea?: number

  plotSize?: number


  mustHave?: string[]

  niceToHave?: string[]


  spouseName?: string

  coBuyer?: string


  referralSource?: string


  notes?: string

  privateNotes?: string


  advisorId?: string


  nextFollowUpAt?: string | null

}


export type UpdateContactDto =
  Partial<CreateContactDto>