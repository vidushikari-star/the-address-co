"use client"

import Link from "next/link"

import type {
  Contact,
} from "@/types"

import {
  Building2,
  Edit,
  Mail,
  MapPin,
  MessageCircle,
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

import {
  createActivity,
} from "@/lib/repositories/activity-repository"



type RelationshipHeaderProps = {
  contact: Contact
}



export function RelationshipHeader({
  contact,
}: RelationshipHeaderProps) {


  const phone =
    (
      contact.whatsapp ??
      contact.phone ??
      ""
    )
    .replace(
      /\D/g,
      ""
    )




  const whatsappMessage =
`Hi ${contact.name},

Following up regarding your property requirement.

Please let me know how I can assist you.`





  async function logActivity(
    type:"whatsapp"|"call",
    title:string,
    body:string
  ){

    try{

      await createActivity({

        type,

        title,

        body,

        contactId:
          contact.id,

        date:
          new Date().toISOString(),

      })

    }catch(error){

      console.error(
        error
      )

    }

  }






  async function handleWhatsApp(){

    await logActivity(
      "whatsapp",
      "WhatsApp opened",
      whatsappMessage
    )


    window.open(
      `https://wa.me/${phone}?text=${encodeURIComponent(
        whatsappMessage
      )}`,
      "_blank"
    )

  }





  async function handleCall(){

    await logActivity(
      "call",
      "Call initiated",
      `Outgoing call to ${contact.name}`
    )


    window.location.href =
      `tel:${phone}`

  }






  return (

    <header
      className="
        border-b
        bg-background
      "
    >


      <div
        className="
          flex
          flex-col
          gap-5
          p-4
          sm:p-6
          lg:flex-row
          lg:items-center
          lg:justify-between
        "
      >






        {/* PROFILE */}

        <div
          className="
            flex
            min-w-0
            items-start
            gap-3
          "
        >


          <Avatar
            className="
              h-12
              w-12
              shrink-0
              sm:h-14
              sm:w-14
            "
          >

            <AvatarFallback>

              {
                contact.name
                  .split(" ")
                  .map(
                    part =>
                      part[0]
                  )
                  .join("")
                  .slice(0,2)
                  .toUpperCase()
              }

            </AvatarFallback>

          </Avatar>





          <div
            className="
              min-w-0
              space-y-2
            "
          >


            <div
              className="
                flex
                flex-wrap
                items-center
                gap-2
              "
            >

              <h1
                className="
                  max-w-[220px]
                  truncate
                  text-xl
                  font-semibold
                  sm:max-w-none
                  sm:text-2xl
                "
              >

                {contact.name}

              </h1>



              <StageSelector
                contact={contact}
              />

            </div>





            <div
              className="
                flex
                flex-wrap
                gap-x-4
                gap-y-1
                text-xs
                text-muted-foreground
                sm:text-sm
              "
            >


              {
                contact.propertyType && (

                  <span className="flex items-center gap-1">

                    <Building2 className="h-3 w-3"/>

                    {contact.propertyType}

                  </span>

                )
              }





              {
                contact.city && (

                  <span className="flex items-center gap-1">

                    <MapPin className="h-3 w-3"/>

                    {contact.city}

                  </span>

                )
              }





              {
                contact.assignedAdvisor && (

                  <span>

                    {contact.assignedAdvisor}

                  </span>

                )
              }


            </div>


          </div>


        </div>









        {/* ACTIONS */}

        <div
          className="
            grid
            grid-cols-2
            gap-2
            sm:flex
            sm:flex-wrap
          "
        >



          {
            phone && (

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleCall}
              >

                <Phone className="mr-2 h-4 w-4"/>

                Call

              </Button>

            )
          }






          {
            phone && (

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleWhatsApp}
              >

                <MessageCircle className="mr-2 h-4 w-4"/>

                WhatsApp

              </Button>

            )
          }






          {
            contact.email && (

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                asChild
              >

                <a
                  href={`mailto:${contact.email}`}
                >

                  <Mail className="mr-2 h-4 w-4"/>

                  Email

                </a>

              </Button>

            )
          }






          <Button
            size="sm"
            className="w-full"
            asChild
          >

            <Link
              href={`/contacts/${contact.id}/edit`}
            >

              <Edit className="mr-2 h-4 w-4"/>

              Edit

            </Link>

          </Button>




        </div>


      </div>


    </header>

  )

}