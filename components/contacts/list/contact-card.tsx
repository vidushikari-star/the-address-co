"use client"

import { useRouter } from "next/navigation"

import {
  ChevronRight,
  Mail,
  Phone,
} from "lucide-react"

import { Avatar } from "@/components/shared/avatar"
import { StatusBadge } from "@/components/shared/status-badge"
import { WhatsAppButton } from "@/components/communications/whatsapp-button"
import { cn } from "@/lib/utils"
import type { Contact } from "@/types/contact"


type ContactCardProps = {
  contact: Contact
  onClick?: (contact: Contact) => void
  className?: string
}


export function ContactCard({
  contact,
  onClick,
  className,
}: ContactCardProps) {

  const router = useRouter()


  function handleClick() {

    onClick?.(contact)

    router.push(
      `/contacts/${contact.id}`
    )

  }



  const phone = (
    contact.whatsapp ??
    contact.phone ??
    ""
  ).replace(/\D/g, "")



  return (

    <div
      className={cn(
        `
        rounded-2xl
        border
        bg-card
        p-4
        transition
        active:bg-muted/40
        hover:border-primary/20
        `,
        className
      )}
    >


      <button
        type="button"
        onClick={handleClick}
        className="
          flex
          w-full
          items-center
          gap-3
          text-left
        "
      >

        <Avatar
          name={contact.name || "Unknown"}
          size="md"
        />



        <div className="min-w-0 flex-1">


          <div className="flex flex-wrap items-center gap-2">

            <h3 className="truncate font-semibold">

              {contact.name || "Unnamed"}

            </h3>


            <StatusBadge
              status={contact.stage}
            />

          </div>




          <div className="
            mt-2
            space-y-1
            text-sm
            text-muted-foreground
          ">


            {contact.phone && (

              <div className="flex items-center gap-2">

                <Phone className="h-3.5 w-3.5" />

                {contact.phone}

              </div>

            )}




            {contact.email && (

              <div className="flex items-center gap-2">

                <Mail className="h-3.5 w-3.5" />

                <span className="truncate">

                  {contact.email}

                </span>

              </div>

            )}


          </div>


        </div>




        <ChevronRight className="h-5 w-5 text-muted-foreground" />


      </button>





      <div
        className="
          mt-4
          grid
          grid-cols-2
          gap-2
          border-t
          pt-3
        "
      >


        {phone && (

          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full"
          >

            <WhatsAppButton
              contact={contact}
            />

          </div>

        )}





        {contact.phone && (
  <a
    href={`tel:${contact.phone}`}
    onClick={(e) => e.stopPropagation()}
    className="
      flex
      h-9
      w-full
      items-center
      justify-center
      gap-2
      rounded-xl
      border
      px-3
      text-sm
    "
  >
    <Phone className="h-4 w-4" />
    Call
  </a>
)}


      </div>


    </div>

  )

}