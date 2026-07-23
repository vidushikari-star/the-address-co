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

    async function loadData() {

      try {

        if (deal.contactId) {

          const contact =
            await ContactsRepository.getById(
              deal.contactId
            )

          setBuyer(contact)

        }


        if (deal.propertyId) {

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

  }, [
    deal.contactId,
    deal.propertyId,
  ])





  return (

    <Link href={`/deals/${deal.id}`}>

      <div className="rounded-2xl border bg-card p-4 transition hover:border-primary hover:shadow-md">


        <div className="flex items-start justify-between">


          <div className="flex items-center gap-3">


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



            <div>


              <p className="font-semibold">
                {
                  deal.name ??
                  "Untitled Deal"
                }
              </p>



              <p className="text-xs text-muted-foreground">

                {
                  buyer?.name ??
                  "Buyer not assigned"
                }

              </p>



              <p className="text-xs text-muted-foreground">

                {
                  deal.advisor
                }

              </p>


            </div>


          </div>





          <Badge>

            {
              deal.probability
            }%

          </Badge>


        </div>





        {
          property?.coverImage && (

            <img

              src={
                property.coverImage
              }

              alt={
                property.name
              }

              className="mt-4 h-36 w-full rounded-xl object-cover"

            />

          )
        }





        <div className="mt-4">


          <p className="font-semibold">

            {
              property?.name ??
              "No property assigned"
            }

          </p>



          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">


            <MapPin className="h-3 w-3" />


            {
              property?.locality
            }


          </div>


        </div>





        <div className="mt-5 grid grid-cols-1 gap-4 text-sm">


          <div>

            <p className="text-muted-foreground">
              Deal Value
            </p>


            <p className="font-semibold">

              {
                formatCurrencyCr(
                  deal.value.propertyPrice
                )
              }

            </p>


          </div>


        </div>





        <div className="mt-5 flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">


          <div className="flex items-center gap-1">


            <Calendar className="h-4 w-4" />


            {
              deal.expectedCloseDate
            }


          </div>





          <div className="flex items-center gap-3">


            <div className="flex items-center gap-1">


              <CheckSquare className="h-4 w-4" />


              {
                deal.tasks?.length ?? 0
              }


            </div>





            <div className="flex items-center gap-1">


              <FileText className="h-4 w-4" />


              {
                deal.notes?.length ?? 0
              }


            </div>


          </div>


        </div>


      </div>


    </Link>

  )

}