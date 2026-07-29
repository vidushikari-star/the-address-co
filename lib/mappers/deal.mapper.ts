import type { Deal } from "@/types/deal"

type DealRow = {
  id: string
  name: string | null
  stage: Deal["stage"] | null
  contact_id: string | null
  property_id: string | null
  advisor: {
    name: string | null
  } | null
  advisor_id: string | null
  property_price: number | string | null
  commission_percentage: number | string | null
  commission_amount: number | string | null
  expected_close_date: string | null
  probability: number | string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
  priority: Deal["priority"] | null
  tasks: string[] | null
  last_activity: string | null
}

export function mapDealRow(
  row: DealRow
): Deal {
  const now = new Date().toISOString()

  return {
    id: row.id,

    name: row.name ?? "Untitled Deal",

    stage: row.stage ?? "lead",

    contactId: row.contact_id ?? "",

    propertyId: row.property_id ?? "",

    advisor: row.advisor?.name ?? "",

    advisorId: row.advisor_id ?? undefined,

    value: {
      propertyPrice: Number(row.property_price ?? 0),

      commissionPercentage: Number(
        row.commission_percentage ?? 0
      ),

      commissionAmount: Number(
        row.commission_amount ?? 0
      ),
    },

    expectedCloseDate:
      row.expected_close_date ?? undefined,

    probability: Number(row.probability ?? 0),

    notes: row.notes ? [row.notes] : [],

    createdAt: row.created_at ?? now,

    updatedAt: row.updated_at ?? now,

    priority: row.priority ?? "medium",

    tasks: row.tasks ?? [],

    lastActivity:
      row.last_activity ??
      row.updated_at ??
      now,
  }
}