import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"



export const WhatsAppServerRepository = {


  async getConversation(
    id: string
  ) {


    const supabase =
      await createServerSupabaseClient()



    const {
      data,
      error,
    } =
      await supabase
        .from("whatsapp_conversations")
        .select(`
          *,
          contact:contacts(
            id,
            first_name,
            last_name,
            phone,
            whatsapp,
            email
          )
        `)
        .eq(
          "id",
          id
        )
        .maybeSingle()



    if (error)
      throw error



    return data


  },





  async getMessages(
    conversationId: string
  ) {


    const supabase =
      await createServerSupabaseClient()



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



    return data ?? []


  },


}