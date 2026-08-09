import { mapDealRow } from "@/lib/mappers/deal.mapper"
import { createServerSupabaseClient } from "@/lib/supabase/server"

import type { Deal } from "@/types/deal"

export async function getServerDeals(): Promise<Deal[]> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase
    .from("deals")
    .select(`
      *,
      advisor:user_profiles (
        name
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map(mapDealRow)
}
