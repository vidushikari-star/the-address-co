export interface ContactRow {
  id: string

  advisor_id: string | null

  created_at: string
  updated_at: string

  first_name: string
  last_name: string | null
  full_name: string

  email: string | null
  phone: string
  whatsapp: string | null

  preferred_language: string | null

  city: string | null
  country: string | null

  lead_source: string | null

  housing_lead_id: string | null

  relationship_types: string[] | null
  
  lead_stage: string
  lead_temperature: string

  last_contacted_at: string | null
  next_follow_up_at: string | null

  budget_min: number | null
  budget_max: number | null

  currency: string | null

  purpose: string | null
  timeline: string | null
  financing: string | null

  resident: string | null

  property_type: string | null

  bedrooms: string | null
  bathrooms: number | null

  locations: string[] | null

  min_area: number | null
  max_area: number | null
  plot_size: number | null

  must_have: string[] | null
  nice_to_have: string[] | null

  spouse_name: string | null
  co_buyer: string | null

  referral_source: string | null

  notes: string | null
  private_notes: string | null

  assigned_advisor?: string | null
}