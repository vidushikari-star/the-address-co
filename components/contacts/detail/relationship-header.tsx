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
  Badge,
} from "@/components/ui/badge"

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
    type:
      | "whatsapp"
      | "call",
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
        "Failed creating activity",
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

    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">


      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between">





        <div className="flex items-center gap-4">


          <Avatar className="h-14 w-14">

            <AvatarFallback>

              {
                contact.name
                  .split(" ")
                  .map(
                    part =>
                      part[0]
                  )
                  .join("")
                  .slice(
                    0,
                    2
                  )
                  .toUpperCase()
              }

            </AvatarFallback>

          </Avatar>





          <div className="space-y-2">


            <div className="flex flex-wrap items-center gap-2">


              <h1 className="text-2xl font-semibold tracking-tight">

                {contact.name}

              </h1>



              <StageSelector
                contact={contact}
              />


            </div>





            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground">


              {
                contact.budgetMin !== undefined &&
                contact.budgetMax !== undefined && (

                  <div>

                    ₹
                    {
                      contact.budgetMin.toLocaleString()
                    }

                    {" – "}

                    ₹
                    {
                      contact.budgetMax.toLocaleString()
                    }

                  </div>

                )
              }





              {
                contact.propertyType && (

                  <div className="flex items-center gap-1">

                    <Building2 className="h-4 w-4" />

                    {contact.propertyType}

                  </div>

                )
              }





              {
                contact.city && (

                  <div className="flex items-center gap-1">

                    <MapPin className="h-4 w-4" />

                    {contact.city}

                    {
                      contact.country
                        ? `, ${contact.country}`
                        : ""
                    }

                  </div>

                )
              }





              <div>

                {
                  contact.assignedAdvisor ??
                  "Unassigned"
                }

              </div>


            </div>


          </div>


        </div>









        <div className="flex flex-wrap items-center gap-2">


          {
            phone && (

              <Button

                variant="outline"

                size="sm"

                onClick={handleCall}

              >

                <Phone className="mr-2 h-4 w-4" />

                Call

              </Button>

            )
          }








          {
            phone && (

              <Button

                variant="outline"

                size="sm"

                onClick={handleWhatsApp}

              >

                <MessageCircle className="mr-2 h-4 w-4" />

                WhatsApp

              </Button>

            )
          }








          {
            contact.email && (

              <a

                href={`mailto:${contact.email}`}

              >

                <Button
                  variant="outline"
                  size="sm"
                >

                  <Mail className="mr-2 h-4 w-4" />

                  Email

                </Button>


              </a>

            )
          }








          <Link href={`/contacts/${contact.id}/edit`}>

            <Button size="sm">

              <Edit className="mr-2 h-4 w-4" />

              Edit

            </Button>


          </Link>





        </div>


      </div>


    </header>

  )

}