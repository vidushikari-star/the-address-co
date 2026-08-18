import type { createServerSupabaseClient } from "@/lib/supabase/server"

import { mapActivityRow } from "@/lib/mappers/activity.mapper"

import type { Activity } from "@/types/activity"

type AuthenticatedCrmClient = Awaited<ReturnType<typeof createServerSupabaseClient>>

export async function createServerActivity(
  supabase: AuthenticatedCrmClient,
  activity: Partial<Activity> & { nextFollowUpAt?: string },
): Promise<Activity> {
  const { data: { user } } = await supabase.auth.getUser()
  const actorId = activity.createdBy ?? activity.userId ?? user?.id ?? null

  const { data, error } = await supabase
    .from("activities")
    .insert({
      contact_id: activity.contactId,
      deal_id: activity.dealId,
      property_id: activity.propertyId,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      body: activity.body,
      activity_date: activity.date,
      created_by: actorId,
      user_id: actorId,
    })
    .select()
    .single()

  if (error) throw error

  if (activity.contactId) {
    const updatePayload: {
      last_activity_at: string
      next_follow_up_at?: string
      lead_stage?: "contacted"
    } = { last_activity_at: new Date().toISOString() }

    if (activity.nextFollowUpAt) updatePayload.next_follow_up_at = activity.nextFollowUpAt

    if (["property_shared", "whatsapp", "email", "call"].includes(activity.type ?? "")) {
      const { data: contact } = await supabase
        .from("contacts")
        .select("lead_stage")
        .eq("id", activity.contactId)
        .maybeSingle()

      if (contact?.lead_stage === "new") updatePayload.lead_stage = "contacted"
    }

    await supabase
      .from("contacts")
      .update(updatePayload)
      .eq("id", activity.contactId)
  }

  return mapActivityRow(data)
}
