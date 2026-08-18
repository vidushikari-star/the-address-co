import type { createServerSupabaseClient } from "@/lib/supabase/server"

import { mapActivityRow } from "@/lib/mappers/activity.mapper"
import { mapContactRow } from "@/lib/mappers/contact.mapper"
import { mapDealRow } from "@/lib/mappers/deal.mapper"
import { mapPropertyRow } from "@/lib/mappers/property.mapper"

import type { Activity } from "@/types/activity"
import type { CommissionDistribution } from "@/types/commission-distribution"
import type { Contact } from "@/types/contact"
import type { ContactRow } from "@/types/contact-row"
import type { Deal } from "@/types/deal"
import type { Expense } from "@/types/expense"
import type { Property, PropertyContactRelationship } from "@/types/property"
import type { PropertyDocument } from "@/types/property-document"
import type { SiteVisit, SiteVisitStatus } from "@/types/site-visit"
import type { UserProfile } from "@/types/user"

export type AuthenticatedCrmClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

export type ContactSummary = {
  propertiesOwned: number
  dealsCount: number
  closedDeals: number
  commissionGenerated: number
  lastActivityAt?: string
}

export type PropertyImage = {
  id: string
  propertyId: string
  url: string
  isCover: boolean
  mediaType: "image" | "video"
  createdAt: string
  publicShareAllowed: boolean
}

export type PropertySource = {
  id: string
  relationshipType: PropertyContactRelationship
  contact: {
    id: string
    name: string
    phone?: string
    email?: string
  }
  commission?: {
    id: string
    percentage?: number
    amount?: number
    commissionType?: string
    commissionBasis?: string
  }
}

export type PropertyShareStatus = "shared" | "viewed" | "interested" | "site_visit" | "rejected"

export type PropertyShare = {
  id: string
  dealId: string
  contactId: string
  propertyId: string
  status: PropertyShareStatus
  buyerFeedback?: string
  notes?: string
  sharedAt: string
  createdAt: string
  createdBy?: string
  advisorName?: string
}

type ContactWithAdvisorRow = ContactRow & {
  advisor?: { id: string; full_name: string | null } | null
}

type PropertyImageRow = {
  id: string
  property_id: string
  url: string
  is_cover: boolean
  media_type: "image" | "video" | null
  created_at: string
  public_share_allowed: boolean | null
}

type PropertyDocumentRow = {
  id: string
  property_id: string
  name: string
  category: PropertyDocument["category"]
  file_url: string
  file_type: string
  created_at: string
  public_share_allowed: boolean | null
}

type PropertyShareRow = {
  id: string
  deal_id: string
  contact_id: string
  property_id: string
  status: PropertyShareStatus
  buyer_feedback: string | null
  notes: string | null
  shared_at: string
  created_at: string
  created_by: string | null
}

type SiteVisitRow = {
  id: string
  deal_id: string | null
  contact_id: string
  property_id: string
  advisor_id: string | null
  scheduled_date: string
  scheduled_time: string
  status: SiteVisitStatus
  notes: string | null
  buyer_feedback: string | null
  created_at: string
  updated_at: string
  contact: { full_name: string | null } | null
  property: { name: string | null } | null
}

type ExpenseRow = {
  id: string
  date: string
  category: Expense["category"]
  description: string | null
  amount: number | string | null
  payment_method: Expense["paymentMethod"] | null
  status: Expense["status"]
  notes: string | null
  created_by: string | null
  created_at: string
}

type CommissionDistributionRow = {
  id: string
  commission_id: string
  user_id: string
  role: CommissionDistribution["role"]
  percentage: number | string | null
  amount: number | string | null
  status: CommissionDistribution["status"]
  paid_date: string | null
  notes: string | null
  created_at: string
  user: { name: string | null } | null
  commissions: {
    amount: number | string | null
    deals: { name: string | null } | null
  } | null
}

type UserProfileRow = {
  id: string
  name: string
  email: string | null
  role: UserProfile["role"]
  created_at: string
  updated_at: string
}

function mapPropertyImage(row: PropertyImageRow): PropertyImage {
  return {
    id: row.id,
    propertyId: row.property_id,
    url: row.url,
    isCover: row.is_cover,
    mediaType: row.media_type ?? "image",
    createdAt: row.created_at,
    publicShareAllowed: row.public_share_allowed ?? false,
  }
}

function mapPropertyDocument(row: PropertyDocumentRow): PropertyDocument {
  return {
    id: row.id,
    propertyId: row.property_id,
    name: row.name,
    category: row.category,
    fileUrl: row.file_url,
    fileType: row.file_type,
    createdAt: row.created_at,
    publicShareAllowed: row.public_share_allowed ?? false,
  }
}

function mapPropertyShare(row: PropertyShareRow): PropertyShare {
  return {
    id: row.id,
    dealId: row.deal_id,
    contactId: row.contact_id,
    propertyId: row.property_id,
    status: row.status,
    buyerFeedback: row.buyer_feedback ?? undefined,
    notes: row.notes ?? undefined,
    sharedAt: row.shared_at,
    createdAt: row.created_at,
    createdBy: row.created_by ?? undefined,
  }
}

function mapSiteVisit(row: SiteVisitRow, advisorName = ""): SiteVisit {
  return {
    id: row.id,
    dealId: row.deal_id ?? undefined,
    contactId: row.contact_id,
    propertyId: row.property_id,
    contactName: row.contact?.full_name ?? "",
    propertyName: row.property?.name ?? "",
    advisorId: row.advisor_id ?? undefined,
    advisorName,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    status: row.status,
    notes: row.notes ?? undefined,
    buyerFeedback: row.buyer_feedback ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    date: row.date,
    category: row.category,
    description: row.description ?? undefined,
    amount: Number(row.amount ?? 0),
    paymentMethod: row.payment_method ?? undefined,
    status: row.status,
    notes: row.notes ?? undefined,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
  }
}

function mapCommissionDistribution(row: CommissionDistributionRow): CommissionDistribution {
  return {
    id: row.id,
    commissionId: row.commission_id,
    userId: row.user_id,
    userName: row.user?.name ?? undefined,
    role: row.role,
    percentage: row.percentage != null ? Number(row.percentage) : undefined,
    amount: Number(row.amount ?? 0),
    status: row.status,
    paidDate: row.paid_date ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    dealName: row.commissions?.deals?.name ?? undefined,
    commissionAmount: Number(row.commissions?.amount ?? 0),
  }
}

function mapUserProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function getSiteVisits(
  supabase: AuthenticatedCrmClient,
  column: "contact_id" | "deal_id",
  id: string,
): Promise<SiteVisit[]> {
  const { data, error } = await supabase
    .from("site_visits")
    .select("*, contact:contacts(full_name), property:properties(name)")
    .eq(column, id)
    .order("scheduled_date", { ascending: true })

  if (error) throw error

  const rows = (data as unknown as SiteVisitRow[] | null) ?? []
  const advisorIds = [...new Set(rows.map(row => row.advisor_id).filter((id): id is string => Boolean(id)))]
  const advisorNames = new Map<string, string>()

  if (advisorIds.length) {
    const { data: advisors, error: advisorError } = await supabase
      .from("user_profiles")
      .select("id,name")
      .in("id", advisorIds)

    if (advisorError) throw advisorError
    for (const advisor of advisors ?? []) advisorNames.set(advisor.id, advisor.name)
  }

  return rows.map(row => mapSiteVisit(row, row.advisor_id ? advisorNames.get(row.advisor_id) ?? "" : ""))
}

export function createAuthenticatedCrmReadRepository(supabase: AuthenticatedCrmClient) {
  return {
    async getContacts(): Promise<Contact[]> {
      const { data, error } = await supabase
        .from("contacts")
        .select("*, advisor:profiles!contacts_advisor_id_fkey(id, full_name)")
        .order("created_at", { ascending: false })

      if (error) throw error

      return ((data as unknown as ContactWithAdvisorRow[] | null) ?? []).map(row => ({
        ...mapContactRow(row),
        advisorId: row.advisor?.id ?? undefined,
        assignedAdvisor: row.advisor?.full_name ?? undefined,
      }))
    },

    async getContactById(id: string): Promise<Contact | null> {
      const { data, error } = await supabase
        .from("contacts")
        .select("*, advisor:profiles!contacts_advisor_id_fkey(id, full_name)")
        .eq("id", id)
        .maybeSingle()

      if (error) throw error
      if (!data) return null

      const row = data as unknown as ContactWithAdvisorRow
      return {
        ...mapContactRow(row),
        assignedAdvisor: row.advisor?.full_name ?? undefined,
      }
    },

    async getPropertyById(id: string): Promise<Property | undefined> {
      const { data, error } = await supabase.from("properties").select("*").eq("id", id).single()

      if (error?.code === "PGRST116") return undefined
      if (error) throw error
      return mapPropertyRow(data)
    },

    async getPropertyBySlug(slug: string): Promise<Property | undefined> {
      const { data, error } = await supabase.from("properties").select("*").eq("slug", slug).single()

      if (error?.code === "PGRST116") return undefined
      if (error) throw error
      return mapPropertyRow(data)
    },

    async getPropertiesByIds(ids: string[]): Promise<Property[]> {
      if (!ids.length) return []

      const { data, error } = await supabase.from("properties").select("*").in("id", ids)
      if (error) throw error
      return (data ?? []).map(mapPropertyRow)
    },

    async getDealById(id: string): Promise<Deal | undefined> {
      const { data, error } = await supabase
        .from("deals")
        .select("*, advisor:user_profiles(name)")
        .eq("id", id)
        .single()

      if (error?.code === "PGRST116") return undefined
      if (error) throw error
      return mapDealRow(data)
    },

    async getDeals(): Promise<Deal[]> {
      const { data, error } = await supabase
        .from("deals")
        .select("*, advisor:user_profiles(name)")
        .order("created_at", { ascending: false })

      if (error) throw error
      return (data ?? []).map(mapDealRow)
    },

    async getDealsByPropertyId(propertyId: string): Promise<Deal[]> {
      const { data, error } = await supabase
        .from("deals")
        .select("*, advisor:user_profiles(name)")
        .eq("property_id", propertyId)

      if (error) throw error
      return (data ?? []).map(mapDealRow)
    },

    async getPropertyImages(propertyId: string): Promise<PropertyImage[]> {
      const { data, error } = await supabase
        .from("property_images")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: true })

      if (error) throw error
      return ((data as unknown as PropertyImageRow[] | null) ?? []).map(mapPropertyImage)
    },

    async getPropertyDocuments(propertyId: string): Promise<PropertyDocument[]> {
      const { data, error } = await supabase
        .from("property_documents")
        .select("*")
        .eq("property_id", propertyId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return ((data as unknown as PropertyDocumentRow[] | null) ?? []).map(mapPropertyDocument)
    },

    async getPropertySources(propertyId: string): Promise<PropertySource[]> {
      const { data, error } = await supabase
        .from("property_contacts")
        .select("id, relationship_type, contacts(id, full_name, phone, email)")
        .eq("property_id", propertyId)

      if (error) throw error

      const { data: commissions, error: commissionError } = await supabase
        .from("property_commissions")
        .select("id, property_id, contact_id, source_type, commission_type, percentage, amount")
        .eq("property_id", propertyId)

      if (commissionError) throw commissionError

      return ((data ?? []) as Array<Record<string, unknown>>).map(item => {
        const contacts = item.contacts
        const contact = (Array.isArray(contacts) ? contacts[0] : contacts) as Record<string, unknown> | undefined
        const commission = (commissions ?? []).find(candidate =>
          candidate.contact_id === contact?.id && candidate.source_type === item.relationship_type,
        )

        return {
          id: String(item.id),
          relationshipType: item.relationship_type as PropertyContactRelationship,
          contact: {
            id: String(contact?.id ?? ""),
            name: String(contact?.full_name ?? ""),
            phone: typeof contact?.phone === "string" ? contact.phone : "",
            email: typeof contact?.email === "string" ? contact.email : "",
          },
          commission: commission ? {
            id: commission.id,
            percentage: commission.percentage ?? undefined,
            amount: commission.amount ?? undefined,
            commissionType: commission.commission_type ?? undefined,
          } : undefined,
        }
      })
    },

    async getActivitiesByDealId(dealId: string): Promise<Activity[]> {
      const { data, error } = await supabase
        .from("activities")
        .select("*, actor:profiles!activities_created_by_fkey(full_name)")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return (data ?? []).map(mapActivityRow)
    },

    async getPropertySharesByDealId(dealId: string): Promise<PropertyShare[]> {
      const { data, error } = await supabase
        .from("property_shares")
        .select("*")
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false })

      if (error) throw error
      return ((data as unknown as PropertyShareRow[] | null) ?? []).map(mapPropertyShare)
    },

    getSiteVisitsByContactId(contactId: string): Promise<SiteVisit[]> {
      return getSiteVisits(supabase, "contact_id", contactId)
    },

    getSiteVisitsByDealId(dealId: string): Promise<SiteVisit[]> {
      return getSiteVisits(supabase, "deal_id", dealId)
    },

    async getAllSiteVisits(): Promise<SiteVisit[]> {
      const { data, error } = await supabase
        .from("site_visits")
        .select("*, contact:contacts(full_name), property:properties(name)")
        .order("scheduled_date", { ascending: true })

      if (error) throw error

      const rows = (data as unknown as SiteVisitRow[] | null) ?? []
      const advisorIds = [...new Set(rows.map(row => row.advisor_id).filter((id): id is string => Boolean(id)))]
      const advisorNames = new Map<string, string>()

      if (advisorIds.length) {
        const { data: advisors, error: advisorError } = await supabase
          .from("user_profiles")
          .select("id,name")
          .in("id", advisorIds)

        if (advisorError) throw advisorError
        for (const advisor of advisors ?? []) advisorNames.set(advisor.id, advisor.name)
      }

      return rows.map(row => mapSiteVisit(row, row.advisor_id ? advisorNames.get(row.advisor_id) ?? "" : ""))
    },

    async getContactSummary(
      contactId: string,
      { useLinkedPropertyData = false }: { useLinkedPropertyData?: boolean } = {},
    ): Promise<ContactSummary> {
      let propertyQuery = supabase.from("property_contacts").select("property_id").eq("contact_id", contactId)
      if (!useLinkedPropertyData) propertyQuery = propertyQuery.eq("relationship_type", "owner")

      const { data: propertyData, error: propertyError } = await propertyQuery
      if (propertyError) throw propertyError

      const propertyIds = [...new Set((propertyData ?? []).map(property => property.property_id))]
      const [dealsResult, commissionsResult, activitiesResult] = await Promise.all([
        useLinkedPropertyData
          ? propertyIds.length ? supabase.from("deals").select("id,stage").in("property_id", propertyIds) : Promise.resolve({ data: [], error: null })
          : supabase.from("deals").select("id,stage").eq("contact_id", contactId),
        useLinkedPropertyData
          ? propertyIds.length ? supabase.from("commissions").select("amount").in("property_id", propertyIds) : Promise.resolve({ data: [], error: null })
          : supabase.from("commissions").select("amount").eq("contact_id", contactId),
        supabase.from("activities").select("date,created_at").eq("contact_id", contactId).order("created_at", { ascending: false }).limit(1),
      ])

      if (dealsResult.error) throw dealsResult.error
      if (commissionsResult.error) throw commissionsResult.error
      if (activitiesResult.error) throw activitiesResult.error

      const deals = dealsResult.data ?? []
      const commissions = commissionsResult.data ?? []
      const latestActivity = activitiesResult.data?.[0]

      return {
        propertiesOwned: propertyData?.length ?? 0,
        dealsCount: deals.length,
        closedDeals: deals.filter(deal => deal.stage === "closed_won").length,
        commissionGenerated: commissions.reduce((total, item) => total + Number(item.amount ?? 0), 0),
        lastActivityAt: latestActivity?.date ?? latestActivity?.created_at,
      }
    },

    async getPaidDistributionAmount(commissionIds: string[]): Promise<number> {
      if (!commissionIds.length) return 0

      const { data, error } = await supabase
        .from("commission_distributions")
        .select("amount,status")
        .in("commission_id", commissionIds)

      if (error) throw error
      return (data ?? [])
        .filter(item => item.status === "paid")
        .reduce((sum, item) => sum + Number(item.amount), 0)
    },

    async getExpenses(): Promise<Expense[]> {
      const { data, error } = await supabase.from("expenses").select("*").order("date", { ascending: false })
      if (error) throw error
      return ((data as unknown as ExpenseRow[] | null) ?? []).map(mapExpense)
    },

    async getAllCommissionDistributions(): Promise<CommissionDistribution[]> {
      const { data, error } = await supabase
        .from("commission_distributions")
        .select("*, user:user_profiles(name), commissions(amount, deals(name))")
        .order("created_at", { ascending: false })

      if (error) throw error
      return ((data as unknown as CommissionDistributionRow[] | null) ?? []).map(mapCommissionDistribution)
    },

    async getUserProfiles(): Promise<UserProfile[]> {
      const { data, error } = await supabase.from("user_profiles").select("*").order("created_at", { ascending: false })
      if (error) throw error
      return ((data as unknown as UserProfileRow[] | null) ?? []).map(mapUserProfile)
    },

    async getCompanySettings(): Promise<Record<string, string>> {
      const { data, error } = await supabase.from("company_settings").select("key,value")
      if (error) throw error
      return Object.fromEntries((data ?? []).map(item => [item.key, item.value ?? ""]))
    },
  }
}
