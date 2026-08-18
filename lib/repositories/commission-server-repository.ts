import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"

import type {
  Commission,
} from "@/types/commission"

import { createServerActivity } from "@/lib/repositories/server-activity-repository"

type CommissionRow = {
  id: string
  deal_id: string
  contact_id: string | null
  property_id: string | null
  advisor_id: string | null
  advisor_name?: string | null
  deal_name?: string | null

  commission_type: Commission["type"]
    commission_role:
    | "buyer"
    | "tenant"
    | "owner"
    | "developer"
    | "broker"
    | "mou_holder"
    | null
  commission_basis: Commission["commissionBasis"] | null
  commission_percentage: number | string | null
  amount: number | string | null
  status: Commission["status"]

  due_date: string | null
  received_date: string | null

  invoice_number: string | null
  invoice_date: string | null
  payment_reference: string | null
  payment_mode: string | null
  payment_date: string | null

  notes: string | null

  created_at: string
  updated_at: string

  deals?: {
    name: string | null
  } | null
}

type AdvisorRow = {
  id: string
  name: string
}

type UserProfileRole = {
  role: string
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

    dealName:
      row.deal_name ??
      "-",

    type:
      row.commission_type,

      commissionRole:
  row.commission_role ?? undefined,

    commissionBasis:
      row.commission_basis ?? undefined,

    commissionPercentage:
      row.commission_percentage != null
        ? Number(row.commission_percentage)
        : undefined,

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

    invoiceNumber:
      row.invoice_number ?? undefined,

    invoiceDate:
      row.invoice_date ?? undefined,

    paymentReference:
      row.payment_reference ?? undefined,

    paymentMode:
      row.payment_mode ?? undefined,

    paymentDate:
      row.payment_date ?? undefined,

    notes:
      row.notes ?? undefined,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  }
}

async function attachAdvisorNames(
  supabase: Awaited<
    ReturnType<typeof createServerSupabaseClient>
  >,
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
    data: advisors,
    error,
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

  if (error) {
    console.error(
      "ADVISOR LOOKUP ERROR:",
      error
    )
  }

  const advisorMap = Object.fromEntries(
    (
      (advisors as AdvisorRow[] | null) ??
      []
    ).map((advisor) => [
      advisor.id,
      advisor.name,
    ])
  )

  return rows.map(
    (row) => ({
      ...row,

      advisor_name:
        row.advisor_id
          ? advisorMap[
              row.advisor_id
            ] ?? "Unassigned"
          : "Unassigned",
    })
  )
}

async function createCommissionActivity(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  data: CommissionRow,
  title: string,
  body: string
) {
  await createServerActivity(supabase, {
    type: "commission",

    title,

    description: title,

    body,

    dealId:
      data.deal_id ?? undefined,

    contactId:
      data.contact_id ?? undefined,

    propertyId:
      data.property_id ?? undefined,

    date:
      new Date().toISOString(),
  })
}

export async function getCommissions(): Promise<
  Commission[]
> {
  const supabase =
    await createServerSupabaseClient()

  const {
    data: {
      user,
    },
  } =
    await supabase.auth.getUser()

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

  if (user) {
    const {
      data: profile,
    } =
      await supabase
        .from("user_profiles")
        .select(
          "role"
        )
        .eq(
          "id",
          user.id
        )
        .single()

    if (
      (
        profile as UserProfileRole | null
      )?.role === "sales"
    ) {
      query =
        query.eq(
          "advisor_id",
          user.id
        )
    }
  }

  const {
    data,
    error,
  } =
    await query

  if (error) {
    throw error
  }

  const rows =
    await attachAdvisorNames(
      supabase,
      (data as CommissionRow[] | null) ??
        []
    )

  return rows.map((row) =>
    mapCommissionRow({
      ...row,
      deal_name:
        row.deals?.name ?? "-",
    })
  )
}

export async function getCommissionsByDealId(
  dealId: string
): Promise<Commission[]> {
  const supabase =
    await createServerSupabaseClient()

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
      supabase,
      (data as CommissionRow[] | null) ??
        []
    )

  return rows.map((row) =>
    mapCommissionRow({
      ...row,
      deal_name:
        row.deals?.name ?? "-",
    })
  )
}

export async function createCommission(
  commission: Partial<Commission>
): Promise<Commission> {
  const supabase =
    await createServerSupabaseClient()

  const {
    data,
    error,
  } =
    await supabase
      .from("commissions")
      .insert({
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

          commission_role:
  commission.commissionRole ?? null,

        commission_basis:
          commission.commissionBasis ??
          null,

        commission_percentage:
          commission.commissionPercentage ??
          null,

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
      })
      .select()
      .single()

  if (error) {
    throw error
  }

  await createCommissionActivity(
    supabase,
    data as CommissionRow,
    "Commission Created",
    `Commission created.

Amount:
₹${Number(data.amount).toLocaleString("en-IN")}

Role:
${data.commission_role ?? "-"}

Basis:
${data.commission_basis ?? "-"}`
  )

  return mapCommissionRow(
    data as CommissionRow
  )
}

export async function updateCommission(
  id: string,
  updates: Partial<Commission>
): Promise<Commission> {
  return editCommission(
    id,
    updates
  )
}

export async function markCommissionInvoiced(
  id: string
): Promise<Commission> {
  const supabase =
    await createServerSupabaseClient()

  const {
    data,
    error,
  } =
    await supabase
      .from("commissions")
      .update({
        status:
          "invoiced",

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

  await createCommissionActivity(
    supabase,
    data as CommissionRow,
    "Commission Invoiced",
    `Commission marked as invoiced.

Amount:
₹${Number(data.amount).toLocaleString("en-IN")}

Role:
${data.commission_role ?? "-"}

Basis:
${data.commission_basis ?? "-"}`
  )

  return mapCommissionRow(
    data as CommissionRow
  )
}

export async function markCommissionReceived(
  id: string
): Promise<Commission> {
  const supabase =
    await createServerSupabaseClient()

  const {
    data,
    error,
  } =
    await supabase
      .from("commissions")
      .update({
        status:
          "received",

        received_date:
          new Date().toISOString(),

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

  await createCommissionActivity(
    supabase,
    data as CommissionRow,
    "Commission Received",
    `Payment received.

Amount:
₹${Number(data.amount).toLocaleString("en-IN")}

Role:
${data.commission_role ?? "-"}

Basis:
${data.commission_basis ?? "-"}`
  )

  return mapCommissionRow(
    data as CommissionRow
  )
}

export async function editCommission(
  id: string,
  updates: Partial<Commission>
): Promise<Commission> {
  const supabase =
    await createServerSupabaseClient()

  const {
    data,
    error,
  } =
    await supabase
      .from("commissions")
      .update({
        amount:
          updates.amount ?? 0,

        advisor_id:
          updates.advisorId,

        commission_basis:
          updates.commissionBasis,

        commission_percentage:
          updates.commissionPercentage,

        status:
          updates.status,

        due_date:
          updates.dueDate || null,

        notes:
          updates.notes || null,

        invoice_number:
          updates.invoiceNumber || null,

        invoice_date:
          updates.invoiceDate || null,

        payment_reference:
          updates.paymentReference || null,

        payment_mode:
          updates.paymentMode || null,

        payment_date:
          updates.paymentDate || null,

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

  await createCommissionActivity(
    supabase,
    data as CommissionRow,
    "Commission Updated",
    `Commission details updated.

Amount:
₹${Number(data.amount).toLocaleString("en-IN")}

Status:
${data.status}`
  )

  return mapCommissionRow(
    data as CommissionRow
  )
}
