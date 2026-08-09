"use client"

import type {
  Contact,
} from "@/types"

import {
  BadgeIndianRupee,
  Home,
  MapPin,
  Target,
} from "lucide-react"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"



type Props = {
  contact: Contact

  inventoryContact?: boolean
}





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





export function LeadIntentCard({
  contact,
  inventoryContact = false,
}:Props){


  const intent =
    contact.intent === "sale"
      ? "Sale"
      : contact.intent === "rental"
      ? "Rental"
      : contact.intent === "both"
      ? "Sale + Rental"
      : null




  const budget =
    contact.budgetMin || contact.budgetMax
      ? [
          formatBudget(contact.budgetMin),
          formatBudget(contact.budgetMax),
        ]
        .filter(Boolean)
        .join(" - ")
      : null





  return (

    <Card
      className="
        rounded-2xl
      "
    >

      <CardHeader
        className="
          px-4
          py-3
        "
      >

        <CardTitle
          className="
            flex
            items-center
            gap-2
            text-base
          "
        >

          <Target
            className="
              h-4
              w-4
            "
          />

          Lead Intent

        </CardTitle>

      </CardHeader>





      <CardContent
        className="
          space-y-3
          px-4
          pb-5
        "
      >


        {
          intent && (

            <div className="flex items-center gap-2">

              <Badge variant="secondary">

                {intent}

              </Badge>

            </div>

          )
        }





        {
          contact.propertyType && (

            <div className="
              flex
              items-center
              gap-2
              text-sm
            ">

              <Home
                className="
                  h-4
                  w-4
                  text-muted-foreground
                "
              />

              {contact.propertyType}

            </div>

          )
        }






        {
          budget && (

            <div className="
              flex
              items-center
              gap-2
              text-sm
            ">

              <BadgeIndianRupee
                className="
                  h-4
                  w-4
                  text-muted-foreground
                "
              />

              ₹ {budget}

            </div>

          )
        }






        {
          contact.locations &&
          contact.locations.length > 0 && (

            <div className="
              flex
              items-start
              gap-2
              text-sm
            ">

              <MapPin
                className="
                  mt-0.5
                  h-4
                  w-4
                  text-muted-foreground
                "
              />

              <span>

                {contact.locations.join(", ")}

              </span>

            </div>

          )
        }





        {
          !intent &&
          !budget &&
          !contact.propertyType && (

            <p className="
              text-sm
              text-muted-foreground
            ">

              {
                inventoryContact
                  ? "No sale or lease intent added."
                  : "No buying requirements added."
              }

            </p>

          )
        }


      </CardContent>


    </Card>

  )

}
