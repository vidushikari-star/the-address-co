import {
  supabase,
} from "@/lib/supabase/client"

import type {
  Commission,
} from "@/types/commission"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

type CommissionRow = {
  id: string
  deal_id: string
  contact_id: string | null
  property_id: string | null
  advisor_id: string | null
  advisor_name?: string | null

  commission_type: Commission["type"]

  amount: number | string | null

  status: Commission["status"]

  due_date: string | null
  received_date: string | null

  notes: string | null

  created_at: string
  updated_at: string

  deals?: {
    name: string | null
  } | null
}

type UserProfileRow = {
  id: string
  name: string
}

function mapCommissionRow(
  row: CommissionRow
): Commission {
  return {
    id:
      row.id,

    dealId:
      row.deal_id,

    contactId:
      row.contact_id ?? undefined,

    propertyId:
      row.property_id ?? undefined,

    advisorId:
      row.advisor_id ?? undefined,

    advisorName:
      row.advisor_name ??
      "Unassigned",

    type:
      row.commission_type,

    amount:
      Number(
        row.amount ?? 0
      ),

    status:
      row.status,

    dueDate:
      row.due_date ?? undefined,

    receivedDate:
      row.received_date ?? undefined,

    notes:
      row.notes ?? undefined,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,

    dealName:
      row.deals?.name ??
      "-",
  }
}

async function attachAdvisorNames(
  rows: CommissionRow[]
): Promise<CommissionRow[]> {
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

  if (
    advisorIds.length === 0
  ) {
    return rows
  }

  const {
    data: profiles,
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

  const advisorMap =
    new Map<string, string>()

  ;(
    (profiles as UserProfileRow[] | null) ??
    []
  ).forEach(
    (profile) => {
      advisorMap.set(
        profile.id,
        profile.name
      )
    }
  )

  return rows.map(
    (row) => ({
      ...row,

      advisor_name:
        row.advisor_id
          ? advisorMap.get(
              row.advisor_id
            ) ?? "Unassigned"
          : "Unassigned",
    })
  )
}

export async function getCommissions(): Promise<
  Commission[]
> {
  const {
    data,
    error,
  } =
    await supabase
      .from("commissions")
      .select(`
        *,
        deals(
          name
        )
      `)
      .order(
        "created_at",
        {
          ascending: false,
        }
      )

  if (error) {
    throw error
  }

  const rows =
    await attachAdvisorNames(
      (data as CommissionRow[] | null) ??
        []
    )

  return rows.map(
    mapCommissionRow
  )
}

export async function getCommissionsByDealId(
  dealId: string
): Promise<Commission[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from("commissions")
      .select(`
        *,
        deals(
          name
        )
      `)
      .eq(
        "deal_id",
        dealId
      )

  if (error) {
    throw error
  }

  const rows =
    await attachAdvisorNames(
      (data as CommissionRow[] | null) ??
        []
    )

  return rows.map(
    mapCommissionRow
  )
}

export async function createCommission(
  commission: Partial<Commission>
): Promise<Commission> {
  const payload = {
    deal_id:
      commission.dealId,

    contact_id:
      commission.contactId ?? null,

    property_id:
      commission.propertyId ?? null,

    advisor_id:
      commission.advisorId ?? null,

    commission_type:
      commission.type ?? "sale",

    amount:
      commission.amount ?? 0,

    status:
      commission.status ?? "pending",

    due_date:
      commission.dueDate ?? null,

    notes:
      commission.notes ?? null,

    created_at:
      new Date().toISOString(),
  }

  const {
    data,
    error,
  } =
    await supabase
      .from("commissions")
      .insert(
        payload
      )
      .select()
      .single()

  if (error) {
    throw error
  }

  return mapCommissionRow(
    data as CommissionRow
  )
}

export async function updateCommission(
  id: string,
  updates: Partial<Commission>
): Promise<Commission> {
  const {
    data,
    error,
  } =
    await supabase
      .from("commissions")
      .update({
        amount:
          updates.amount,

        status:
          updates.status,

        due_date:
          updates.dueDate,

        received_date:
          updates.receivedDate,

        notes:
          updates.notes,

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

  return mapCommissionRow(
    data as CommissionRow
  )
}

export async function markCommissionReceived(
  id: string
): Promise<Commission> {
  const commission =
    await updateCommission(
      id,
      {
        status:
          "received",

        receivedDate:
          new Date().toISOString(),
      }
    )

  await createActivity({
    type:
      "commission_received",

    title:
      "Commission Received",

    description:
      `₹${commission.amount.toLocaleString(
        "en-IN"
      )} received`,

    body:
      `Commission Type:
${commission.type}

Amount:
₹${commission.amount.toLocaleString(
  "en-IN"
)}

Status:
Received`,

    dealId:
      commission.dealId,

    contactId:
      commission.contactId,

    propertyId:
      commission.propertyId,

    date:
      new Date().toISOString(),
  })

  return commission
}