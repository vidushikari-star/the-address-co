"use client"

import React from "react"
import Link from "next/link"

import type { Deal } from "@/types/deal"
import type { Contact } from "@/types/contact"
import type { Property } from "@/types/property"

import { ContactsRepository } from "@/lib/supabase/repositories/contacts.repository"
import { getPropertyById } from "@/lib/repositories/property-repository"

import { formatCurrencyCr } from "@/lib/formatters/currency"

import {
  Calendar,
  CheckSquare,
  FileText,
  MapPin,
  ArrowRight,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
} from "@/components/ui/avatar"

import { Badge } from "@/components/ui/badge"


type Props = {
  deal: Deal
}





export function DealCard({
  deal,
}: Props) {


  const [
    buyer,
    setBuyer,
  ] = React.useState<Contact | null>(null)



  const [
    property,
    setProperty,
  ] = React.useState<Property | undefined>()




  React.useEffect(() => {

    async function loadData(){

      try {

        if(deal.contactId){

          const contact =
            await ContactsRepository.getById(
              deal.contactId
            )

          setBuyer(contact)

        }



        if(deal.propertyId){

          const propertyData =
            await getPropertyById(
              deal.propertyId
            )

          setProperty(propertyData)

        }


      } catch {

        setBuyer(null)

        setProperty(undefined)

      }

    }


    loadData()

  },[
    deal.contactId,
    deal.propertyId,
  ])







  return (

    <Link
      href={`/deals/${deal.id}`}
      className="block"
    >


      <div

        className="
          rounded-2xl
          border
          bg-card
          p-4
          transition
          hover:border-primary
          hover:shadow-md
        "

      >



        <div className="flex items-start justify-between gap-3">


          <div className="flex min-w-0 items-center gap-3">


            <Avatar>

              <AvatarFallback>

                {
                  buyer?.name
                  ?.split(" ")
                  .map(
                    n => n[0]
                  )
                  .join("")
                }

              </AvatarFallback>

            </Avatar>





            <div className="min-w-0">


              <p className="truncate font-semibold">

                {deal.name || "Untitled Deal"}

              </p>



              <p className="truncate text-xs text-muted-foreground">

                {buyer?.name || "Buyer not assigned"}

              </p>



            </div>


          </div>





          <ArrowRight className="h-4 w-4 text-muted-foreground" />


        </div>







        <div className="mt-4 flex flex-wrap items-center gap-2">


          <Badge>

            {deal.stage.replace(
              "_",
              " "
            )}

          </Badge>




          {
            deal.priority === "high" && (

              <Badge variant="destructive">

                High Priority

              </Badge>

            )
          }


        </div>








        <div className="mt-4">


          <p className="text-xs text-muted-foreground">
            Deal Value
          </p>


          <p className="text-xl font-semibold">

            {
              formatCurrencyCr(
                deal.value.propertyPrice
              )
            }

          </p>


        </div>








        {
          property && (

            <div className="mt-4 rounded-xl bg-muted/40 p-3">


              <p className="font-medium">

                {property.name}

              </p>



              {
                property.locality && (

                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">


                    <MapPin className="h-3 w-3"/>


                    {property.locality}


                  </p>

                )
              }


            </div>

          )

        }








        <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">


          <div className="flex items-center gap-1">


            <Calendar className="h-4 w-4"/>


            {
              deal.expectedCloseDate
              ?
              new Date(
                deal.expectedCloseDate
              ).toLocaleDateString(
                "en-IN"
              )
              :
              "No close date"
            }


          </div>





          <div className="flex items-center gap-3">


            <span className="flex items-center gap-1">

              <CheckSquare className="h-4 w-4"/>

              {deal.tasks?.length ?? 0}

            </span>





            <span className="flex items-center gap-1">

              <FileText className="h-4 w-4"/>

              {deal.notes?.length ?? 0}

            </span>


          </div>


        </div>


      </div>


    </Link>

  )

}