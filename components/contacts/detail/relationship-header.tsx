"use client"

import {
  useState,
} from "react"

import Link from "next/link"

import type { Contact } from "@/types"

import {
  Building2,
  Edit,
  Mail,
  MapPin,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"

import {
  Button,
} from "@/components/ui/button"

import {
  Badge,
} from "@/components/ui/badge"

import {
  formatContactRole,
} from "@/lib/utils/format-contact-role"

import {
  StageSelector,
} from "@/components/contacts/detail/stage-selector"

import { WhatsAppButton } from "@/components/communications/whatsapp-button"

import {
  WhatsAppCallButton,
} from "@/components/communications/whatsapp-call-button"

import {
  ContactActivityDrawer,
} from "./contact-activity-drawer"



type RelationshipHeaderProps = {
  contact: Contact
}





export function RelationshipHeader({
  contact,
}: RelationshipHeaderProps) {


  const [
    activityOpen,
    setActivityOpen,
  ] =
  useState(false)





  const phone = (
    contact.whatsapp ??
    contact.phone ??
    ""
  ).replace(/\D/g, "")






  const initials =
    contact.name
      .split(" ")
      .map(
        part => part[0]
      )
      .join("")
      .slice(0,2)
      .toUpperCase()






  function formatBudget(
    value?: number
  ){

    if(!value){
      return null
    }


    if(value >= 10000000){

      return `${(
        value / 10000000
      ).toFixed(1)} Cr`

    }


    if(value >= 100000){

      return `${(
        value / 100000
      ).toFixed(0)} L`

    }


    return value.toString()

  }





  const budgetLabel =
    contact.budgetMin || contact.budgetMax
      ? [
          formatBudget(contact.budgetMin),
          formatBudget(contact.budgetMax),
        ]
        .filter(Boolean)
        .join(" - ")
      : null





  const intentLabel =
    contact.intent === "sale"
      ? "Sale"
      : contact.intent === "rental"
      ? "Rental"
      : contact.intent === "both"
      ? "Sale + Rental"
      : null







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






              {
                (
                  contact.leadSource?.toLowerCase() === "housing" ||
                  contact.leadSource?.toLowerCase() === "housing.com"
                )
                &&
                (

                  <Badge variant="secondary">

                    🏠 Housing.com Lead

                  </Badge>

                )
              }





              {
                intentLabel && (

                  <Badge variant="outline">

                    {intentLabel}

                  </Badge>

                )
              }

              {
  contact.relationshipTypes?.map(
    role => (

      <Badge
        key={role}
        variant="secondary"
      >

        {
          formatContactRole(
            role
          )
        }

      </Badge>

    )
  )
}





              {
                budgetLabel && (

                  <Badge variant="outline">

                    ₹ {budgetLabel}

                  </Badge>

                )
              }






              <StageSelector
                contact={contact}
              />



            </div>







            <div className="
              flex
              flex-wrap
              gap-2
            ">


              {
                contact.propertyType && (

                  <Badge variant="secondary">

                    <Building2
                      className="
                        mr-1
                        h-3.5
                        w-3.5
                      "
                    />

                    {contact.propertyType}

                  </Badge>

                )
              }





              {
                contact.city && (

                  <Badge variant="secondary">

                    <MapPin
                      className="
                        mr-1
                        h-3.5
                        w-3.5
                      "
                    />

                    {contact.city}

                  </Badge>

                )
              }



              {
                contact.assignedAdvisor && (

                  <Badge variant="secondary">

                    {contact.assignedAdvisor}

                  </Badge>

                )
              }



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





          {
            phone && (

              <WhatsAppCallButton
                contact={contact}
                variant="outline"
                size="sm"
                className="w-full sm:w-auto"
              />

            )
          }







          {
            contact.email && (

              <a
                href={`mailto:${contact.email}`}
                className="w-full sm:w-auto"
              >

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                >

                  <Mail
                    className="
                      mr-2
                      h-4
                      w-4
                    "
                  />

                  Email

                </Button>

              </a>

            )
          }








          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() =>
              setActivityOpen(true)
            }
          >

            Add Activity

          </Button>







          <Link
            href={`/contacts/${contact.id}/edit`}
            className="w-full sm:w-auto"
          >

            <Button
              size="sm"
              className="w-full"
            >

              <Edit
                className="
                  mr-2
                  h-4
                  w-4
                "
              />

              Edit

            </Button>

          </Link>




        </div>


      </div>






      <ContactActivityDrawer

        open={
          activityOpen
        }

        onOpenChange={
          setActivityOpen
        }

        contactId={
          contact.id
        }

      />



    </header>

  )

}
