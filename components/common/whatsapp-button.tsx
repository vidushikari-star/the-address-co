"use client"

import Link from "next/link"

import {
  MessageCircle,
} from "lucide-react"

import {
  logWhatsAppActivity,
} from "@/lib/actions/housing-whatsapp-action"



type Props = {

  phone:string

  contactId:string

  dealId:string

}



export function WhatsAppButton({
  phone,
  contactId,
  dealId,
}:Props){


  async function handleClick(){

    await logWhatsAppActivity(
      contactId,
      dealId
    )

  }



  return (

    <Link

      href={
        `https://wa.me/${phone.replace(/\D/g,"")}`
      }

      target="_blank"

      onClick={
        handleClick
      }

    >

      <button

        className="
          inline-flex
          items-center
          gap-2
          rounded-md
          border
          px-3
          py-2
          text-sm
          hover:bg-muted
        "

      >

        <MessageCircle
          className="h-4 w-4"
        />

        WhatsApp

      </button>

    </Link>

  )

}