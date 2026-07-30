"use client"

import Link from "next/link"

import type { Contact } from "@/types"

import {
  Building2,
  Edit,
  Mail,
  MapPin,
  Phone,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"

import {
  Button,
} from "@/components/ui/button"

import {
  StageSelector,
} from "@/components/contacts/detail/stage-selector"

import { WhatsAppButton } from "@/components/communications/whatsapp-button"

import { createActivity } from "@/lib/repositories/activity-repository"


type RelationshipHeaderProps = {
  contact: Contact
}


export function RelationshipHeader({
  contact,
}: RelationshipHeaderProps) {


  const phone = (
    contact.whatsapp ??
    contact.phone ??
    ""
  ).replace(/\D/g, "")



  async function logCallActivity() {

    try {

      await createActivity({

        type: "call",

        title: "Call initiated",

        body: `Outgoing call to ${contact.name}`,

        contactId: contact.id,

        date: new Date().toISOString(),

      })

    } catch {

      // Activity logging should not block user action

    }

  }



  async function handleCall() {

    await logCallActivity()

    window.location.href =
      `tel:${phone}`

  }



  const initials =
    contact.name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()



  return (

    <header className="border-b bg-background">

      <div className="
        flex
        flex-col
        gap-6
        p-4
        sm:p-6
        lg:flex-row
        lg:items-center
        lg:justify-between
      ">


        <div className="
          flex
          min-w-0
          items-start
          gap-4
        ">


          <Avatar className="
            h-14
            w-14
            shrink-0
            sm:h-16
            sm:w-16
          ">

            <AvatarFallback className="
              text-lg
              font-semibold
            ">

              {initials}

            </AvatarFallback>

          </Avatar>




          <div className="
            min-w-0
            space-y-3
          ">


            <div className="
              flex
              flex-wrap
              items-center
              gap-2
            ">


              <h1 className="
                max-w-[240px]
                truncate
                text-xl
                font-semibold
                sm:max-w-none
                sm:text-2xl
              ">

                {contact.name}

              </h1>


              <StageSelector
                contact={contact}
              />


            </div>




            <div className="
              flex
              flex-wrap
              gap-x-4
              gap-y-2
              text-sm
              text-muted-foreground
            ">


              {contact.propertyType && (

                <span className="
                  flex
                  items-center
                  gap-1
                ">

                  <Building2 className="h-4 w-4" />

                  {contact.propertyType}

                </span>

              )}




              {contact.city && (

                <span className="
                  flex
                  items-center
                  gap-1
                ">

                  <MapPin className="h-4 w-4" />

                  {contact.city}

                </span>

              )}




              {contact.assignedAdvisor && (

                <span>

                  {contact.assignedAdvisor}

                </span>

              )}


            </div>


          </div>


        </div>






        <div className="
          grid
          grid-cols-2
          gap-3
          sm:flex
          sm:flex-wrap
        ">


          <WhatsAppButton
            contact={contact}
          />



          {phone && (

            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={handleCall}
            >

              <Phone className="mr-2 h-4 w-4" />

              Call

            </Button>

          )}





          {contact.email && (

            <a
              href={`mailto:${contact.email}`}
              className="w-full sm:w-auto"
            >

              <Button
                variant="outline"
                size="sm"
                className="w-full"
              >

                <Mail className="mr-2 h-4 w-4" />

                Email

              </Button>

            </a>

          )}






          <Link
            href={`/contacts/${contact.id}/edit`}
            className="w-full sm:w-auto"
          >

            <Button
              size="sm"
              className="w-full"
            >

              <Edit className="mr-2 h-4 w-4" />

              Edit

            </Button>

          </Link>



        </div>


      </div>


    </header>

  )

}