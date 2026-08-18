import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Activity, ActivityType } from "@/types/activity"

export type ActivityEntity = "contact" | "deal" | "property"

export type ActivityHistoryItem = Activity & {
  actorName: string
  entity: {
    type: ActivityEntity
    label: string
    href: string
  } | null
}

export type ActivityHistoryFilters = {
  type?: string
  actorId?: string
  entity?: ActivityEntity
  entityId?: string
  from?: string
  to?: string
  page?: number
}

export async function getActivityHistory(filters: ActivityHistoryFilters = {}) {
  const supabase = await createServerSupabaseClient()
  const page = Math.max(filters.page ?? 1, 1)
  const pageSize = 50
  let query = supabase
    .from("activities")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (filters.type) query = query.eq("type", filters.type)
  if (filters.actorId) query = query.eq("created_by", filters.actorId)
  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00+05:30`)
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59+05:30`)
  if (filters.entity === "contact") query = query.not("contact_id", "is", null)
  if (filters.entity === "deal") query = query.not("deal_id", "is", null)
  if (filters.entity === "property") query = query.not("property_id", "is", null)
  if (filters.entityId && filters.entity === "contact") query = query.eq("contact_id", filters.entityId)
  if (filters.entityId && filters.entity === "deal") query = query.eq("deal_id", filters.entityId)
  if (filters.entityId && filters.entity === "property") query = query.eq("property_id", filters.entityId)

  const { data, error, count } = await query
  if (error) throw error

  const rows = data ?? []
  const profileIds = [...new Set(rows.map(row => row.created_by).filter((id): id is string => Boolean(id)))]
  const contactIds = [...new Set(rows.map(row => row.contact_id).filter((id): id is string => Boolean(id)))]
  const dealIds = [...new Set(rows.map(row => row.deal_id).filter((id): id is string => Boolean(id)))]
  const propertyIds = [...new Set(rows.map(row => row.property_id).filter((id): id is string => Boolean(id)))]

  const [profilesResult, contactsResult, dealsResult, propertiesResult] = await Promise.all([
    profileIds.length ? supabase.from("profiles").select("id,full_name").in("id", profileIds) : Promise.resolve({ data: [], error: null }),
    contactIds.length ? supabase.from("contacts").select("id,full_name").in("id", contactIds) : Promise.resolve({ data: [], error: null }),
    dealIds.length ? supabase.from("deals").select("id,name").in("id", dealIds) : Promise.resolve({ data: [], error: null }),
    propertyIds.length ? supabase.from("properties").select("id,name,slug").in("id", propertyIds) : Promise.resolve({ data: [], error: null }),
  ])

  for (const result of [profilesResult, contactsResult, dealsResult, propertiesResult]) {
    if (result.error) throw result.error
  }

  const profiles = new Map((profilesResult.data ?? []).map(profile => [profile.id, profile.full_name]))
  const contacts = new Map((contactsResult.data ?? []).map(contact => [contact.id, contact.full_name]))
  const deals = new Map((dealsResult.data ?? []).map(deal => [deal.id, deal.name]))
  const properties = new Map((propertiesResult.data ?? []).map(property => [property.id, property]))

  const items: ActivityHistoryItem[] = rows.map(row => {
    const entity = row.contact_id
      ? { type: "contact" as const, label: contacts.get(row.contact_id) ?? "Contact", href: `/contacts/${row.contact_id}` }
      : row.deal_id
        ? { type: "deal" as const, label: deals.get(row.deal_id) ?? "Deal", href: `/deals/${row.deal_id}` }
        : row.property_id
          ? (() => {
            const property = properties.get(row.property_id)
            return { type: "property" as const, label: property?.name ?? "Property", href: property?.slug ? `/properties/${property.slug}` : "/properties" }
          })()
          : null

    return {
      id: row.id,
      type: row.type as ActivityType,
      title: row.title,
      description: row.description ?? undefined,
      body: row.body ?? undefined,
      date: row.activity_date ?? row.created_at ?? undefined,
      createdAt: new Date(row.created_at ?? row.activity_date ?? Date.now()),
      createdBy: row.created_by ?? undefined,
      userId: row.user_id ?? undefined,
      actorName: row.created_by ? profiles.get(row.created_by) ?? "Unknown user" : "System",
      contactId: row.contact_id ?? undefined,
      dealId: row.deal_id ?? undefined,
      propertyId: row.property_id ?? undefined,
      entity,
    }
  })

  return {
    items,
    total: count ?? items.length,
    page,
    pageSize,
  }
}

export async function getActivityActors() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name")
    .order("full_name")
  if (error) throw error
  return data ?? []
}
