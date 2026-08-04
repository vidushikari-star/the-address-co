"use server"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"



export async function logWhatsAppActivity(
  contactId:string,
  dealId:string
){

  await createActivity({

    contactId,

    dealId,

    type:
      "whatsapp",

    title:
      "WhatsApp message initiated",

    description:
      "Lead contacted through WhatsApp",

    date:
      new Date().toISOString(),

  })

}