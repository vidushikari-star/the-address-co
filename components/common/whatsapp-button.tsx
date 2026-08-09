"use client"

import {
  MessageCircle,
} from "lucide-react"

import {
  logWhatsAppActivity,
} from "@/lib/actions/housing-whatsapp-action"



type Props = {

  phone:string

  contactId:string

  dealId?:string

}



export function WhatsAppButton({
  phone,
  contactId,
  dealId,
}:Props){

  const normalizedPhone = phone.replace(/\D/g, "")

  if (!normalizedPhone) {
    return null
  }


  async function handleClick(){

    if(dealId){

  await logWhatsAppActivity(
    contactId,
    dealId
  )

}

  }



  return (
    <a
      href={`https://wa.me/${normalizedPhone}`}
      target="_blank"
      rel="noreferrer"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
    >
      <MessageCircle className="h-4 w-4" />
      WhatsApp
    </a>
  )

}
