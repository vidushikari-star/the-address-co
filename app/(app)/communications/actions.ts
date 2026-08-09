"use server"

import {
  TemplatesRepository,
} from "@/lib/supabase/repositories/templates.repository"

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"

import {
  qualifyWhatsAppMessage,
} from "@/lib/communications/qualify-whatsapp"





export async function qualifyConversation(
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
    throw new Error("Not authenticated")
  }



  const {
    data: conversation,
    error: fetchError,
  } =
    await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq(
        "id",
        conversationId
      )
      .eq(
        "owner_id",
        user.id
      )
      .single()



  if (fetchError) {

    throw fetchError

  }



  const qualification =
    qualifyWhatsAppMessage(
      conversation.last_message ?? ""
    )



  const {
    data,
    error,
  } =
    await supabase
      .from("whatsapp_conversations")
      .update({

        lead_type:
          qualification.intent,

        property_type:
          qualification.propertyType ?? null,

        location:
          qualification.location ?? null,

        budget:
          qualification.budget ?? null,

        bedrooms:
          qualification.bedrooms ?? null,

        qualification,

      })
      .eq(
        "id",
        conversationId
      )
      .eq(
        "owner_id",
        user.id
      )
      .select()
      .single()



  if(error){

    throw error

  }



  return data

}








export async function listWhatsAppTemplates() {

  const supabase = await createServerSupabaseClient()

  const {
    data: {
      user,
    },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  const templates =
    await TemplatesRepository.list()



  return templates.filter(
    (template) =>
      template.channel.toLowerCase() === "whatsapp" &&
      template.status === "active"
  )

}








export async function incrementTemplateUsage(
  id:string
) {

  const supabase = await createServerSupabaseClient()

  const {
    data: {
      user,
    },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }

  await TemplatesRepository.incrementUsage(id)

}








export async function getCurrentAdvisor() {

  const supabase =
    await createServerSupabaseClient()



  const {
    data:{
      user,
    },
  } =
    await supabase.auth.getUser()



  if(!user){

    return null

  }




  const {
    data,
    error,
  } =
    await supabase
      .from("user_profiles")
      .select(
        "id, name, email"
      )
      .eq(
        "id",
        user.id
      )
      .single()



  if(error){

    console.error(
      "PROFILE ERROR:",
      error
    )

    return null

  }



  if (!data) {
    return null
  }

  return {
    id: data.id,
    full_name: data.name,
    email: data.email ?? "",
  }

}








export async function createContactFromWhatsApp(
  conversationId:string
) {

  const supabase =
    await createServerSupabaseClient()



  const {
    data:{
      user,
    },
  } =
    await supabase.auth.getUser()



  if(!user){

    throw new Error(
      "Not authenticated"
    )

  }






  const {
    data:conversation,
    error:conversationError,
  } =
    await supabase
      .from("whatsapp_conversations")
      .select("*")
      .eq(
        "id",
        conversationId
      )
      .eq(
        "owner_id",
        user.id
      )
      .single()



  if(conversationError){

    throw conversationError

  }






  const qualification =
    conversation.qualification ?? {}







  if(conversation.contact_id){


    return {
      id:
        conversation.contact_id,
    }


  }








  const {
    data:contact,
    error:contactError,
  } =
    await supabase
      .from("contacts")
      .insert({

        first_name:
          conversation.contact_name ??
          "WhatsApp Lead",


        phone:
          conversation.phone_number,


        whatsapp:
          conversation.phone_number,


        created_by:
          user.id,


        owner_id:
          user.id,


        is_private:
          false,


        lead_source:
          "whatsapp",



        purpose:
          null,



        property_type:
          qualification.propertyType
            ?.toLowerCase() ?? null,



        bedrooms:
          qualification.bedrooms ?? null,



        locations:
          qualification.location
            ? [
                qualification.location
              ]
            : null,



        budget_min:
          qualification.budget
            ? Number(qualification.budget)
            : null,


      })
      .select()
      .single()






  if(contactError){

    throw contactError

  }








  await supabase
    .from("whatsapp_conversations")
    .update({

      contact_id:
        contact.id,


      status:
        "converted",

    })
    .eq(
      "id",
      conversationId
    )
    .eq(
      "owner_id",
      user.id
    )







  return {

    ...contact,

  }

}








export async function rewriteWhatsAppMessage(
  message:string,
  tone:
    | "formal"
    | "warm"
    | "concise"
    | "luxury"
) {

  const supabase = await createServerSupabaseClient()

  const {
    data: {
      user,
    },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Not authenticated")
  }


  const instructions = {


    formal:
      "Rewrite this message in a formal professional business tone while keeping it natural:",



    warm:
      "Rewrite this message in a warm friendly relationship-building tone:",



    concise:
      "Rewrite this message shorter and clearer while keeping the meaning:",



    luxury:
      "Rewrite this message in a premium luxury real estate advisor tone suitable for HNI clients:",


  }



  return `${instructions[tone]}

${message}`

}
