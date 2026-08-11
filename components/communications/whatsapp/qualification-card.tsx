"use client"

import {
  useState,
} from "react"

import {
  BadgeCheck,
  BedDouble,
  MapPin,
  IndianRupee,
  Home,
} from "lucide-react"

import { Card } from "@/components/ui/card"

import { Button } from "@/components/ui/button"

import {
  PropertySelector,
} from "@/components/communications/whatsapp/property-selector"

import {
  WhatsAppComposer,
} from "@/components/communications/whatsapp-composer"

import {
  generatePropertyShareMessage,
} from "@/lib/communications/property-message"

import {
  formatCurrency,
} from "@/lib/utils/format-currency"

import type {
  WhatsAppQualification,
} from "@/lib/communications/qualify-whatsapp"

import type { Contact } from "@/types"



type QualificationCardProps = {

  qualification: WhatsAppQualification

  contact?: Contact

}








export function QualificationCard({

  qualification,

  contact,

}: QualificationCardProps) {


  const [
    selectorOpen,
    setSelectorOpen,
  ] =
  useState(false)



  const [
    composerOpen,
    setComposerOpen,
  ] =
  useState(false)



  const [
    propertyMessage,
    setPropertyMessage,
  ] =
  useState("")





  if (!qualification) {

    return null

  }





  return (

    <Card
      className="
        p-4
        space-y-4
      "
    >


      <div className="
        flex
        items-center
        gap-2
      ">

        <BadgeCheck
          className="
            h-5
            w-5
            text-primary
          "
        />

        <h3 className="font-semibold">

          Lead Qualification

        </h3>


      </div>





      <div className="
        grid
        gap-3
        text-sm
      ">


        {
          qualification.intent && (

            <div className="
              flex
              items-center
              gap-2
            ">

              <BadgeCheck className="h-4 w-4" />

              <span>
                Intent:
              </span>

              <strong>
                {qualification.intent}
              </strong>

            </div>

          )
        }






        {
          qualification.propertyType && (

            <div className="
              flex
              items-center
              gap-2
            ">

              <Home className="h-4 w-4" />

              <span>
                Property:
              </span>

              <strong>
                {qualification.propertyType}
              </strong>

            </div>

          )
        }






        {
          qualification.location && (

            <div className="
              flex
              items-center
              gap-2
            ">

              <MapPin className="h-4 w-4" />

              <span>
                Location:
              </span>

              <strong>
                {qualification.location}
              </strong>

            </div>

          )
        }






        {
          qualification.bedrooms && (

            <div className="
              flex
              items-center
              gap-2
            ">

              <BedDouble className="h-4 w-4" />

              <span>
                Bedrooms:
              </span>

              <strong>
                {qualification.bedrooms}
              </strong>

            </div>

          )
        }






        {
          qualification.budget && (

            <div className="
              flex
              items-center
              gap-2
            ">

              <IndianRupee className="h-4 w-4" />

              <span>
                Budget:
              </span>

              <strong>
                {
                  formatCurrency(
                    Number(
                      qualification.budget
                    )
                  )
                }
              </strong>

            </div>

          )
        }


      </div>





      {
        contact && (

          <Button

            variant="outline"

            onClick={() =>
              setSelectorOpen(true)
            }

          >

            Share Property

          </Button>

        )
      }






      <PropertySelector

        open={
          selectorOpen
        }


        onOpenChange={
          setSelectorOpen
        }


        onSelect={
          (property)=>{


            const message =
              generatePropertyShareMessage({

                contactName:
                  contact?.name,

                property: {
                  name: property.name,
                  location: property.location,
                  publicLink:
                    property.public_share_enabled && property.public_share_token
                      ? `${window.location.origin}/share/${property.public_share_token}`
                      : "",
                },

              })



            setPropertyMessage(
              message
            )



            setSelectorOpen(
              false
            )



            setComposerOpen(
              true
            )


          }
        }

      />






      {
        contact && (

          <WhatsAppComposer

            open={
              composerOpen
            }


            onOpenChange={
              setComposerOpen
            }


            contact={
              contact
            }


            initialMessage={
              propertyMessage
            }

          />

        )
      }




    </Card>

  )

}
