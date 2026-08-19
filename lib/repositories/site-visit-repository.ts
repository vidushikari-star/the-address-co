import {
  supabase,
} from "@/lib/supabase/client"

import type {
  SiteVisit,
  SiteVisitStatus,
} from "@/types/site-visit"

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
      row.deal_id ?? undefined,

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
    dealId?: string
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
          data.dealId ?? null,

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



export async function getSiteVisitsByContactId(
  contactId: string
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
        "contact_id",
        contactId
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

export async function updateSiteVisit(
id: string,
data: {
  scheduledDate?: string
  scheduledTime?: string
  advisorId?: string
  contactId?: string
  propertyId?: string
  status?: SiteVisitStatus
  notes?: string
  buyerFeedback?: string
}
): Promise<SiteVisit> {


const payload: Record<string, unknown> = {}



if(data.scheduledDate !== undefined){

  payload.scheduled_date =
    data.scheduledDate

}


if(data.scheduledTime !== undefined){

  payload.scheduled_time =
    data.scheduledTime

}


if(data.advisorId !== undefined){

  payload.advisor_id =
    data.advisorId || null

}



if(data.contactId !== undefined){

  payload.contact_id =
    data.contactId

}



if(data.propertyId !== undefined){

  payload.property_id =
    data.propertyId

}



if(data.status !== undefined){

  payload.status =
    data.status

}


if(data.notes !== undefined){

  payload.notes =
    data.notes || null

}



if(data.buyerFeedback !== undefined){

  payload.buyer_feedback =
    data.buyerFeedback || null

}



payload.updated_at =
new Date().toISOString()



const {
data: row,
error,
} =
await supabase
.from("site_visits")
.update(payload)
.eq(
"id",
id
)
.select()
.single()



if(error){
throw error
}



return mapSiteVisitRow(
row as SiteVisitRow
)

}



export async function deleteSiteVisit(
  id: string
): Promise<void> {
  const {
    error,
  } = await supabase
    .from("site_visits")
    .delete()
    .eq(
      "id",
      id
    )

  if (error) {
    throw error
  }
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
