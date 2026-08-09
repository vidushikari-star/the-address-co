import { createServerSupabaseClient } from "@/lib/supabase/server"

type HousingActivityType =
  | "contact_created"
  | "note"

type Input = {
  contactId: string
  description: string
  title: string
  type: HousingActivityType
}

export async function recordHousingActivity({
  contactId,
  description,
  title,
  type,
}: Input) {
  const supabase = await createServerSupabaseClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from("activities")
    .insert({
      contact_id: contactId,
      type,
      title,
      description,
      activity_date: now,
    })

  if (error) {
    throw error
  }

  const { error: contactError } = await supabase
    .from("contacts")
    .update({ last_activity_at: now })
    .eq("id", contactId)

  if (contactError) {
    throw contactError
  }
}
