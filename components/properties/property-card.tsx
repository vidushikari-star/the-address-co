import Link from "next/link"

import {
  BedDouble,
  Building2,
  CalendarDays,
  ChevronRight,
  MapPin,
  Users,
} from "lucide-react"

import { StatusBadge } from "@/components/shared/status-badge"
import { formatCurrencyCr } from "@/lib/formatters/currency"
import type { Property } from "@/types/property"


type PropertyCardProps = {
  property: Property
}



export function PropertyCard({
  property,
}: PropertyCardProps) {


  return (

    <Link

      href={`/properties/${property.slug}`}

      className="group flex w-full items-start justify-between rounded-3xl border border-border/60 bg-card p-6 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:bg-background"

    >


      <div className="flex gap-6">


        <div className="h-32 w-44 overflow-hidden rounded-2xl bg-muted">


          {
            property.coverImage ? (

              <img

                src={property.coverImage}

                alt={property.name}

                className="h-full w-full object-cover"

              />

            ) : (

              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">

                No Image

              </div>

            )

          }


        </div>





        <div className="flex flex-col">


          <div className="flex items-center gap-3">


            <h3 className="text-xl font-semibold tracking-tight">

              {property.name}

            </h3>



            <StatusBadge
              status={property.status}
            />


          </div>





          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">


            <MapPin className="h-4 w-4" />


            {property.location}


          </div>





          <p className="mt-5 text-2xl font-semibold text-primary">


            {
              formatCurrencyCr(
                property.price.asking
              )
            }


          </p>





          <div className="mt-3 flex items-center gap-5 text-sm text-muted-foreground">


            <span className="flex items-center gap-1">

              <BedDouble className="h-4 w-4" />

              {property.specifications.bedrooms} Bed

            </span>



            <span>

              {property.specifications.bathrooms} Bath

            </span>



            <span>

              {
                property.specifications.carpetArea.toLocaleString()
              } sqft

            </span>


          </div>





          <div className="mt-5 grid grid-cols-3 gap-6">


            <div>

              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">

                Developer

              </p>


              <div className="mt-1 flex items-center gap-2 text-sm font-medium">


                <Building2 className="h-4 w-4 text-muted-foreground" />


                {property.developer}


              </div>

            </div>





            <div>

              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">

                Buyer Matches

              </p>


              <div className="mt-1 flex items-center gap-2 text-sm font-medium">


                <Users className="h-4 w-4 text-muted-foreground" />


                {property.buyerMatches}


              </div>

            </div>





            <div>

              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">

                Last Shared

              </p>


              <div className="mt-1 flex items-center gap-2 text-sm font-medium">


                <CalendarDays className="h-4 w-4 text-muted-foreground" />


                {property.lastShared}


              </div>

            </div>


          </div>


        </div>


      </div>





      <ChevronRight className="mt-2 h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1" />


    </Link>

  )

}