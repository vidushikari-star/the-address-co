"use server"

import { TemplatesRepository } from "@/lib/supabase/repositories/templates.repository"
import { createServerSupabaseClient } from "@/lib/supabase/server"



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
  id: string
) {

  await TemplatesRepository.incrementUsage(id)

}





export async function getCurrentAdvisor() {

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
  } = await supabase

    .from("profiles")

    .select(
      "id, full_name, email"
    )

    .eq(
      "id",
      user.id
    )

    .single()



  if (error) {

    console.error(
      "PROFILE ERROR:",
      error
    )

    return null

  }



  return data

}





export async function rewriteWhatsAppMessage(
  message: string,
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



  /*
    Temporary rewrite engine.

    Replace this function body later
    with OpenAI API call.
  */


  return `${instructions[tone]}

${message}`

}