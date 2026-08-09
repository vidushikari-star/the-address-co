import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"
import type {
  WhatsAppConversationRow,
  WhatsAppMessageRow,
} from "@/lib/supabase/repositories/whatsapp.repository"
import type {
  ContactRow,
} from "@/types/contact-row"

export type WhatsAppConversationWithContact =
  WhatsAppConversationRow & {
    contact: ContactRow | null
  }



export const WhatsAppServerRepository = {


  async getConversation(
    id: string
  ) {


    const supabase =
      await createServerSupabaseClient()

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }



    const {
      data,
      error,
    } =
      await supabase
        .from("whatsapp_conversations")
        .select(`
          *,
          contact:contacts(*)
        `)
        .eq(
          "id",
          id
        )
        .eq(
          "owner_id",
          user.id
        )
        .maybeSingle()



    if (error)
      throw error



    return (
      data as WhatsAppConversationWithContact | null
    )


  },





  async getMessages(
    conversationId: string
  ) {


    const supabase =
      await createServerSupabaseClient()

    const {
      data: {
        user,
      },
    } = await supabase.auth.getUser()

    if (!user) {
      return [] as WhatsAppMessageRow[]
    }

    const {
      data: conversation,
      error: conversationError,
    } = await supabase
      .from("whatsapp_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("owner_id", user.id)
      .maybeSingle()

    if (conversationError) {
      throw conversationError
    }

    if (!conversation) {
      return [] as WhatsAppMessageRow[]
    }



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


}
