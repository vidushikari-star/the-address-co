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
      .select()
      .single()



  if(error){

    throw error

  }



  return data

}








export async function listWhatsAppTemplates() {

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
      .from("profiles")
      .select(
        "id, full_name, email"
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



  return data

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
          "WhatsApp",



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
          qualification.budget ?? null,


      })
      .select()
      .single()






  if(contactError){

    throw contactError

  }








  const {
    data:deal,
    error:dealError,
  } =
    await supabase
      .from("deals")
      .insert({

        name:
          `${contact.first_name} - ${
            qualification.intent ??
            "Property"
          }`,



        contact_id:
          contact.id,



        stage:
  "qualification",



        probability:
          20,



        priority:
          "medium",



        advisor_id:
          user.id,



        whatsapp_conversation_id:
          conversationId,



        notes:
          conversation.last_message,

      })
      .select()
      .single()






  if(dealError){

    throw dealError

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







  return {

    ...contact,

    deal_id:
      deal.id,

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