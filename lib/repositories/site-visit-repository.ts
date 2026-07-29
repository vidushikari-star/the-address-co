import {
  supabase,
} from "@/lib/supabase/client"

import type {
  SiteVisit,
  SiteVisitStatus,
} from "@/types/site-visit"

type SiteVisitRow = {
  id: string
  deal_id: string
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

  contact: {
    full_name: string | null
  } | null

  property: {
    name: string | null
  } | null

  advisor?: {
    name: string | null
  } | null
}

type AdvisorRow = {
  id: string
  name: string
}

function mapSiteVisitRow(
  row: SiteVisitRow
): SiteVisit {
  return {
    id:
      row.id,

    dealId:
      row.deal_id,

    contactId:
      row.contact_id,

    propertyId:
      row.property_id,

    contactName:
      row.contact?.full_name ?? "",

    propertyName:
      row.property?.name ?? "",

    advisorId:
      row.advisor_id ?? undefined,

    advisorName:
      row.advisor?.name ?? "",

    scheduledDate:
      row.scheduled_date,

    scheduledTime:
      row.scheduled_time,

    status:
      row.status,

    notes:
      row.notes ?? undefined,

    buyerFeedback:
      row.buyer_feedback ?? undefined,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  }
}

export async function createSiteVisit(
  data: {
    dealId: string
    contactId: string
    propertyId: string
    scheduledDate: string
    scheduledTime: string
    notes?: string
    advisorId?: string
  }
): Promise<SiteVisit> {
  const {
    data: row,
    error,
  } =
    await supabase
      .from("site_visits")
      .insert({
        deal_id:
          data.dealId,

        contact_id:
          data.contactId,

        property_id:
          data.propertyId,

        scheduled_date:
          data.scheduledDate,

        scheduled_time:
          data.scheduledTime,

        notes:
          data.notes ?? null,

        advisor_id:
          data.advisorId ?? null,
      })
      .select()
      .single()

  if (error) {
    throw error
  }

  return mapSiteVisitRow(
    row as SiteVisitRow
  )
}

export async function getSiteVisitsByDealId(
  dealId: string
): Promise<SiteVisit[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from("site_visits")
      .select(`
        *,
        contact:contacts(
          full_name
        ),
        property:properties(
          name
        )
      `)
      .eq(
        "deal_id",
        dealId
      )
      .order(
        "scheduled_date",
        {
          ascending: true,
        }
      )

  if (error) {
    throw error
  }

  const rows =
    (data as SiteVisitRow[] | null) ??
    []

  const advisorIds = [
    ...new Set(
      rows
        .map(
          (row) => row.advisor_id
        )
        .filter(
          (
            id
          ): id is string => !!id
        )
    ),
  ]

  let advisors: AdvisorRow[] = []

  if (advisorIds.length) {
    const {
      data: advisorData,
    } =
      await supabase
        .from("user_profiles")
        .select(
          "id,name"
        )
        .in(
          "id",
          advisorIds
        )

    advisors =
      (advisorData as AdvisorRow[] | null) ??
      []
  }

  return rows.map(
    (row) => ({
      ...mapSiteVisitRow(row),

      advisorName:
        advisors.find(
          (advisor) =>
            advisor.id === row.advisor_id
        )?.name ?? "",
    })
  )
}

export async function updateSiteVisitStatus(
  id: string,
  status: SiteVisitStatus,
  buyerFeedback?: string
): Promise<SiteVisit> {
  const {
    data,
    error,
  } =
    await supabase
      .from("site_visits")
      .update({
        status,

        buyer_feedback:
          buyerFeedback ?? null,

        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        id
      )
      .select()
      .single()

  if (error) {
    throw error
  }

  return mapSiteVisitRow(
    data as SiteVisitRow
  )
}

export async function getAllSiteVisits(): Promise<SiteVisit[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from("site_visits")
      .select(`
        *,
        contact:contacts(
          full_name
        ),
        property:properties(
          name
        )
      `)
      .order(
        "scheduled_date",
        {
          ascending: true,
        }
      )

  if (error) {
    throw error
  }

  const rows =
    (data as SiteVisitRow[] | null) ??
    []

  const advisorIds = [
    ...new Set(
      rows
        .map(
          (row) => row.advisor_id
        )
        .filter(
          (
            id
          ): id is string => !!id
        )
    ),
  ]

  let advisors: AdvisorRow[] = []

  if (advisorIds.length) {
    const {
      data: advisorData,
    } =
      await supabase
        .from("user_profiles")
        .select(
          "id,name"
        )
        .in(
          "id",
          advisorIds
        )

    advisors =
      (advisorData as AdvisorRow[] | null) ??
      []
  }

  return rows.map(
    (row) => ({
      ...mapSiteVisitRow(row),

      advisorName:
        advisors.find(
          (advisor) =>
            advisor.id === row.advisor_id
        )?.name ?? "",
    })
  )
}