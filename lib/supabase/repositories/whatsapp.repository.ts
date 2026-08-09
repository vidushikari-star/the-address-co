import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/types/database"

export type WhatsAppConversationRow =
  Database["public"]["Tables"]["whatsapp_conversations"]["Row"]

export type WhatsAppMessageRow =
  Database["public"]["Tables"]["whatsapp_messages"]["Row"]


export const WhatsAppRepository = {


  async getConversations() {

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser()

    if (!user) {
      return [] as WhatsAppConversationRow[]
    }

    const {
      data,
      error,
    } =
      await supabase
        .from("whatsapp_conversations")
        .select("*")
        .eq("owner_id", user.id)
        .order(
          "last_message_at",
          {
            ascending: false,
          }
        )


    if (error)
      throw error


    return (data ?? []) as WhatsAppConversationRow[]

  },





  async getConversation(
  id: string
) {

  const {
    data,
    error,
  } =
    await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq(
        "id",
        id
      )
      .maybeSingle()


  if (error)
    throw error


    return (data as WhatsAppConversationRow | null) ?? null

},





  async getMessages(
    conversationId: string
  ) {

    const {
      data,
      error,
    } =
      await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq(
          "conversation_id",
          conversationId
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        )


    if (error)
      throw error


    return (data ?? []) as WhatsAppMessageRow[]

  },





  async createConversation(
    payload: {
      owner_id: string
      phone_number: string
      contact_name?: string
      last_message?: string
      status?: string
    }
  ) {

    const {
      data,
      error,
    } =
      await supabase
        .from("whatsapp_conversations")
        .insert(payload)
        .select()
        .single()


    if (error)
      throw error


    return data

  },





  async updateConversation(
    id: string,
    payload: Record<string, unknown>
  ) {

    const {
      data,
      error,
    } =
      await supabase
        .from("whatsapp_conversations")
        .update(payload)
        .eq(
          "id",
          id
        )
        .select()
        .single()


    if (error)
      throw error


    return data

  },





  async createMessage(
    payload: {
      conversation_id: string
      direction: "incoming" | "outgoing"
      message: string
      sent_by?: string
      message_type?: string
    }
  ) {

    const {
      data,
      error,
    } =
      await supabase
        .from("whatsapp_messages")
        .insert(payload)
        .select()
        .single()


    if (error)
      throw error


    return data

  },


}
