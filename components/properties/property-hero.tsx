import Link from "next/link"

import {
  MapPin,
  Building2,
  Pencil,
} from "lucide-react"

import { StatusBadge } from "@/components/shared/status-badge"

import { SharePropertyButton } from "@/components/properties/share-property-button"

import {
  formatPropertyPrice,
} from "@/lib/utils/format-currency"

import type { Property } from "@/types/property"


type PropertyHeroProps = {
  property: Property
}


export function PropertyHero({
  property,
}: PropertyHeroProps) {

  const displayPrice =
    property.transactionType === "Rental"
      ? property.price.rent
      : property.price.asking


  return (
    <section
      className="
        overflow-hidden
        rounded-3xl
        border
        bg-card
      "
    >

      <div
        className="
          bg-gradient-to-r
          from-primary/5
          via-background
          to-background
          p-6
          sm:p-8
        "
      >

        <div
          className="
            flex
            flex-col
            gap-6
            lg:flex-row
            lg:items-start
            lg:justify-between
          "
        >

          <div className="min-w-0 flex-1">


            <div className="mb-4 flex flex-wrap items-center gap-3">

              <StatusBadge
                status={property.status}
              />


              <span
                className="
                  rounded-full
                  bg-primary/10
                  px-3
                  py-1
                  text-xs
                  font-medium
                  text-primary
                "
              >

                {property.propertyType}

              </span>

            </div>





            <h1
              className="
                text-3xl
                font-bold
                tracking-tight
                sm:text-4xl
              "
            >

              {property.name}

            </h1>





            <p
              className="
                mt-4
                text-4xl
                font-bold
                text-primary
                sm:text-5xl
              "
            >

              {
                formatPropertyPrice(
                  displayPrice,
                  property.transactionType
                )
              }

            </p>





            <div
              className="
                mt-6
                flex
                flex-col
                gap-3
                text-muted-foreground
                sm:flex-row
                sm:flex-wrap
                sm:items-center
              "
            >

              <div className="flex items-center gap-2">

                <MapPin className="h-4 w-4 shrink-0" />

                <span>
                  {property.location}
                </span>

              </div>




              <div className="hidden sm:block">
                •
              </div>




              <div className="flex items-center gap-2">

                <Building2 className="h-4 w-4 shrink-0" />

                <span>
                  {property.developer}
                </span>

              </div>


            </div>


          </div>





          <div
            className="
              flex
              flex-col
              gap-3
              sm:flex-row
              lg:flex-col
            "
          >

            <SharePropertyButton
              property={property}
            />



            <Link
              href={`/properties/${property.slug}/edit`}
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-primary
                px-5
                py-3
                text-sm
                font-medium
                text-primary-foreground
                transition-colors
                hover:bg-primary/90
              "
            >

              <Pencil className="h-4 w-4" />

              Edit Property

            </Link>


          </div>


        </div>

      </div>

    </section>
  )
}