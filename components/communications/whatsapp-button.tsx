"use client"

import { useState } from "react"

import type { Contact } from "@/types"

import { MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"

import { WhatsAppComposer } from "@/components/communications/whatsapp-composer"


interface WhatsAppButtonProps {
  contact: Contact
}


export function WhatsAppButton({
  contact,
}: WhatsAppButtonProps) {


  const [open, setOpen] =
    useState(false)



  const phone = (
    contact.whatsapp ??
    contact.phone ??
    ""
  ).replace(/\D/g, "")



  if (!phone) {
    return null
  }



  return (

    <>

      <Button
        variant="default"
        size="sm"
        className="h-9 w-full"
        onClick={() => setOpen(true)}
      >

        <MessageCircle className="mr-2 h-4 w-4" />

        WhatsApp

      </Button>



      <WhatsAppComposer

        open={open}

        onOpenChange={setOpen}

        contact={contact}

      />

    </>

  )

}