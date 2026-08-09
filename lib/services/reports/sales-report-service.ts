import { createServerSupabaseClient } from "@/lib/supabase/server"

import type { DealStage } from "@/types/deal"

export type SalesDeal = {
  advisor: string
  commissionAmount: number
  createdAt: string
  expectedCloseDate?: string
  name: string
  probability: number
  propertyPrice: number
  stage: DealStage
}

export async function getSalesReport(): Promise<SalesDeal[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("deals")
    .select(`
      name,
      stage,
      property_price,
      commission_amount,
      expected_close_date,
      probability,
      created_at,
      advisor:user_profiles(name)
    `)

  if (error) {
    throw error
  }

  return (data ?? []).map((deal) => ({
    advisor: deal.advisor?.[0]?.name ?? "-",
    commissionAmount: Number(deal.commission_amount ?? 0),
    createdAt: deal.created_at ?? new Date().toISOString(),
    expectedCloseDate: deal.expected_close_date ?? undefined,
    name: deal.name ?? "Untitled Deal",
    probability: Number(deal.probability ?? 0),
    propertyPrice: Number(deal.property_price ?? 0),
    stage: deal.stage ?? "lead",
  }))
}
