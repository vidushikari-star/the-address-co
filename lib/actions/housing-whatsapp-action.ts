"use server"

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"



export async function logWhatsAppActivity(
  contactId:string,
  dealId:string
){

  const supabase = await createServerSupabaseClient()

  const {
    data: {
      user,
    },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const now = new Date().toISOString()

  const { error } = await supabase
    .from("activities")
    .insert({
      contact_id: contactId,
      deal_id: dealId,
      type: "whatsapp",
      title: "WhatsApp message initiated",
      description: "Lead contacted through WhatsApp",
      activity_date: now,
      created_by: user.id,
      user_id: user.id,
    })

  if (error) {
    throw error
  }

  const { error: contactError } = await supabase
    .from("contacts")
    .update({
      last_activity_at: now,
    })
    .eq("id", contactId)

  if (contactError) {
    throw contactError
  }

}
