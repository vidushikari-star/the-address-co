import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"

import type {
  UserProfile,
} from "@/types/user"

import type {
  Commission,
} from "@/types/commission"

type ServerSupabaseClient =
  Awaited<
    ReturnType<typeof createServerSupabaseClient>
  >

type CommissionRow = {
  id: string
  deal_id: string
  contact_id: string | null
  property_id: string | null
  advisor_id: string | null
  commission_type: Commission["type"]
  commission_role: Commission["commissionRole"] | null
  amount: number | string | null
  status: Commission["status"]
  due_date: string | null
  received_date: string | null
  created_at: string
  updated_at: string
  deals: {
    name: string | null
  } | null
}

function mapCommissionRow(
  row: CommissionRow
): Commission {
  return {
    id: row.id,
    dealId: row.deal_id,
    contactId: row.contact_id ?? undefined,
    propertyId: row.property_id ?? undefined,
    advisorId: row.advisor_id ?? undefined,
    dealName: row.deals?.name ?? "-",
    type: row.commission_type,
    commissionRole: row.commission_role ?? undefined,
    amount: Number(row.amount ?? 0),
    status: row.status,
    dueDate: row.due_date ?? undefined,
    receivedDate: row.received_date ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}



export async function getCommissionStats(
  supabase: ServerSupabaseClient,
  role: UserProfile["role"]
) {


  let query =
    supabase
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

  if (role === "sales") {
    const {
      data: {
        user,
      },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      throw userError
    }

    if (!user) {
      throw new Error(
        "Authenticated user is required for commission statistics."
      )
    }

    query = query.eq(
      "advisor_id",
      user.id
    )
  }

  const {
    data,
    error,
  } = await query

  if (error) {
    throw error
  }

  const commissions =
    (data ?? []).map(
      (row) => mapCommissionRow(
        row as CommissionRow
      )
    )



  const pendingCommissions =
    commissions.filter(
      (commission) =>
        commission.status === "pending" ||
        commission.status === "invoiced"
    )



  const receivedCommissions =
    commissions.filter(
      (commission) =>
        commission.status === "received"
    )





  const pending =
    pendingCommissions.reduce(
      (sum, commission) =>
        sum + commission.amount,
      0
    )





  const received =
    receivedCommissions.reduce(
      (sum, commission) =>
        sum + commission.amount,
      0
    )





  const total =
    commissions.reduce(
      (sum, commission) =>
        sum + commission.amount,
      0
    )





  const today =
  new Date()


const upcoming =
  pendingCommissions
    .filter(
      (commission) =>
        commission.dueDate
        &&
        new Date(
          commission.dueDate
        ) >= today
    )
    .sort(
      (a,b) =>
        new Date(
          a.dueDate!
        ).getTime()
        -
        new Date(
          b.dueDate!
        ).getTime()
    )
    .slice(
      0,
      5
    )





  return {

    total,

    pending,

    received,

    count:
      commissions.length,


    pendingCount:
      pendingCommissions.length,


    receivedCount:
      receivedCommissions.length,


    upcoming,

  }

}
