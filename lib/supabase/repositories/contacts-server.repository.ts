import { createServerSupabaseClient } from "@/lib/supabase/server"
import { normalizePhone } from "@/lib/utils/phone"
import type { Database } from "@/types/supabase"

export interface UpsertHousingContactInput {
  firstName: string
  lastName?: string
  phone: string
  email?: string
  city?: string
  country?: string
  budgetMin?: number
  budgetMax?: number
  propertyType?: Database["public"]["Enums"]["property_type"]
  locations?: string[]
  leadSource: string
  housingLeadId: string
}

export const ContactsServerRepository = {
  async findByHousingLeadId(housingLeadId: string) {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("housing_lead_id", housingLeadId)
      .limit(1)

    if (error) throw error

    return data?.[0] ?? null
  },

  async findByPhone(phone: string) {
    const supabase = await createServerSupabaseClient()

    const normalizedPhone = normalizePhone(phone)

    const { data, error } = await supabase
      .from("contacts")
      .select("*")
      .eq("phone", normalizedPhone)
      .limit(1)

    if (error) throw error

    return data?.[0] ?? null
  },

  async create(contact: UpsertHousingContactInput) {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("contacts")
      .insert({
        first_name: contact.firstName,
        last_name: contact.lastName ?? null,
        phone: contact.phone,
        email: contact.email,
        city: contact.city,
        country: contact.country,
        budget_min: contact.budgetMin,
        budget_max: contact.budgetMax,
        property_type: contact.propertyType,
        locations: contact.locations,
        lead_source: contact.leadSource,
        housing_lead_id: contact.housingLeadId,
      })
      .select()
      .single()

    if (error) throw error

    return data
  },

  async update(id: string, contact: UpsertHousingContactInput) {
    const supabase = await createServerSupabaseClient()

    const { data: existing, error: fetchError } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", id)
      .single()

    if (fetchError) throw fetchError

    const { data, error } = await supabase
      .from("contacts")
      .update({
        email: existing.email ?? contact.email,
        city: existing.city ?? contact.city,
        country: existing.country ?? contact.country,
        budget_min: existing.budget_min ?? contact.budgetMin,
        budget_max: existing.budget_max ?? contact.budgetMax,
        property_type: existing.property_type ?? contact.propertyType,
        locations:
          existing.locations && existing.locations.length > 0
            ? existing.locations
            : contact.locations,
        housing_lead_id:
          existing.housing_lead_id ?? contact.housingLeadId,
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    return data
  },
}