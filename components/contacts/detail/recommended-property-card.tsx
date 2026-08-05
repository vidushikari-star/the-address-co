"use client"

import Link from "next/link"

import type {
  Property,
} from "@/types/property"

import {
  MapPin,
  CalendarDays,
} from "lucide-react"

import {
  Badge,
} from "@/components/ui/badge"

import {
  formatExactPropertyPrice,
} from "@/lib/utils/format-currency"

import {
  PropertyShareStatus,
} from "./property-share-status"

import type {
  PropertyShareStatus as PropertyShareStatusType,
} from "@/lib/repositories/property-share-repository"


type Props = {
  property: Property

  label:
    | "shared"
    | "recommended"

  status?: PropertyShareStatusType

  sharedAt?: string

  shareId?: string

  contactId?: string

}



const statusLabels: Record<string,string> = {

  shared:
    "Shared",

  viewed:
    "Viewed",

  interested:
    "Interested",

  site_visit:
    "Site Visit",

  rejected:
    "Rejected",

}





export function RecommendedPropertyCard({
  property,
  label,
  status,
  sharedAt,
  shareId,
  contactId,
}: Props) {


  return (

    <div
      className="
        rounded-xl
        border
        bg-card
        p-3
      "
    >

      <Link
        href={`/properties/${property.slug}`}
        className="
          flex
          gap-3
        "
      >


        <div
          className="
            h-20
            w-28
            shrink-0
            overflow-hidden
            rounded-lg
            bg-muted
          "
        >

          {
            property.coverImage ? (

              <img
                src={property.coverImage}
                alt={property.name}
                className="
                  h-full
                  w-full
                  object-cover
                "
              />

            ) : (

              <div
                className="
                  flex
                  h-full
                  items-center
                  justify-center
                  text-xs
                  text-muted-foreground
                "
              >
                No Image
              </div>

            )
          }

        </div>





        <div
          className="
            min-w-0
            flex-1
            space-y-1
          "
        >

          <Badge
            variant={
              label === "shared"
                ? "secondary"
                : "outline"
            }
            className="
              text-[10px]
            "
          >

            {
              label === "shared"
                ? "⭐ Shared with Client"
                : "🔎 Recommended Match"
            }

          </Badge>





          <h4
            className="
              truncate
              text-sm
              font-semibold
            "
          >

            {property.name}

          </h4>




          <div
            className="
              flex
              items-center
              gap-1
              text-xs
              text-muted-foreground
            "
          >

            <MapPin className="h-3 w-3" />

            {property.location}

          </div>




          {
            sharedAt && (

              <div
                className="
                  flex
                  items-center
                  gap-1
                  text-xs
                  text-muted-foreground
                "
              >

                <CalendarDays className="h-3 w-3" />

                Shared:

                {" "}

                {
                  new Date(sharedAt)
                    .toLocaleDateString(
                      "en-IN",
                      {
                        day:"numeric",
                        month:"short",
                        year:"numeric",
                      }
                    )
                }

              </div>

            )
          }




          <p className="
            text-sm
            font-medium
          ">

            {
              formatExactPropertyPrice(
                property.transactionType === "Rental"
                  ? property.price.rent
                  : property.price.asking,
                property.transactionType
              )
            }

          </p>


        </div>


      </Link>






      {
        label === "shared" &&
        shareId &&
        contactId &&
        status && (

          <div className="
            mt-3
            flex
            items-center
            justify-between
          ">

            <span className="
              text-xs
              text-muted-foreground
            ">

              Status:
              {" "}
              {
                statusLabels[status]
              }

            </span>


            <PropertyShareStatus

              shareId={
                shareId
              }

              contactId={
                contactId
              }

              propertyId={
                property.id
              }

              propertyName={
                property.name
              }

              status={
                status
              }

            />

          </div>

        )
      }


    </div>

  )

}