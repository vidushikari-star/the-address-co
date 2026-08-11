"use server"

import { revalidatePath } from "next/cache"

import { getServerUserProfile } from "@/lib/auth/server-user-profile"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { DealStage } from "@/types/deal"

const DEAL_STAGES = new Set<DealStage>([
  "lead", "qualification", "property_shared", "site_visit",
  "negotiation", "documentation", "closed_won", "closed_lost",
])

export type DealStageTransitionResult =
  | { ok: true; changed: boolean }
  | { ok: false; error: string }

/** The RPC commits the stage and matching timeline activity together. */
export async function transitionDealStageAction(input: {
  dealId: string
  stage: DealStage
  contactId?: string | null
}): Promise<DealStageTransitionResult> {
  if (!DEAL_STAGES.has(input.stage)) {
    return { ok: false, error: "Choose a valid deal stage." }
  }

  const user = await getServerUserProfile()
  if (!user) return { ok: false, error: "You do not have permission to update this deal." }

  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.rpc("transition_deal_stage", {
      p_deal_id: input.dealId,
      p_stage: input.stage,
    })
    if (error) {
      console.error("Deal stage transition failed", { code: error.code ?? "unknown" })
      return { ok: false, error: "The deal stage could not be saved. Refresh and try again." }
    }

    const changed = Boolean((data as Array<{ changed?: unknown }> | null)?.[0]?.changed)
    revalidatePath("/deals")
    revalidatePath(`/deals/${input.dealId}`)
    revalidatePath("/dashboard")
    if (input.contactId) revalidatePath(`/contacts/${input.contactId}`)
    return { ok: true, changed }
  } catch (error) {
    const name = error && typeof error === "object" && "name" in error ? String(error.name) : "UnknownError"
    console.error("Deal stage transition failed", { name })
    return { ok: false, error: "The deal stage could not be saved. Refresh and try again." }
  }
}
