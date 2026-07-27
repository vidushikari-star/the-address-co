import Link from "next/link"

import {
  BedDouble,
  Building2,
  CalendarDays,
  ChevronRight,
  MapPin,
  Users,
} from "lucide-react"

import {
  StatusBadge,
} from "@/components/shared/status-badge"

import {
  formatCurrencyCr,
} from "@/lib/formatters/currency"

import type {
  Property,
} from "@/types/property"



type PropertyCardProps = {
  property: Property
}





export function PropertyCard({
  property,
}: PropertyCardProps) {


  return (

    <Link

      href={`/properties/${property.slug}`}

      className="
        group
        flex
        w-full
        flex-col
        rounded-3xl
        border
        border-border/60
        bg-card
        p-4
        transition-all
        duration-200
        hover:-translate-y-0.5
hover:border-primary/20
hover:bg-background
        sm:flex-row
        sm:p-6
      "

    >




      {/* IMAGE */}

      <div className="
        h-40
sm:h-32
        w-full
        overflow-hidden
        rounded-2xl
        bg-muted
        sm:h-32
        sm:w-44
        sm:shrink-0
      ">


        {
          property.coverImage ? (

            <img

              src={property.coverImage}

              alt={property.name}

              className="
                h-full
                w-full
                object-cover
                transition-transform
                duration-300
                group-hover:scale-105
              "

            />

          ) : (

            <div className="
              flex
              h-full
              items-center
              justify-center
              text-sm
              text-muted-foreground
            ">

              No Image

            </div>

          )

        }


      </div>







      {/* CONTENT */}

      <div className="
        mt-4
        flex
        min-w-0
        flex-1
        flex-col
        sm:ml-6
        sm:mt-0
      ">



        <div className="
          flex
          items-start
          justify-between
          gap-3
        ">


          <div className="min-w-0">


            <h3 className="
              truncate
              text-lg
              font-semibold
              tracking-tight
              sm:text-xl
            ">

              {property.name}

            </h3>


            <div className="
              mt-1
              flex
              items-center
              gap-1
              text-sm
              text-muted-foreground
            ">

              <MapPin className="h-4 w-4"/>

              {property.location}

            </div>


          </div>




          <StatusBadge
            status={property.status}
          />



        </div>







        <p className="
          mt-4
          text-2xl
          font-semibold
          text-primary
        ">

          {
            formatCurrencyCr(
              property.price.asking
            )
          }

        </p>







        <div className="
          mt-3
          flex
          flex-wrap
          gap-4
          text-sm
          text-muted-foreground
        ">


          <span className="
            flex
            items-center
            gap-1
          ">

            <BedDouble className="h-4 w-4"/>

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








        <div className="
          mt-5
          grid
          grid-cols-1
          gap-3
          border-t
          pt-4
          text-sm
          sm:grid-cols-3
        ">



          <div>

            <p className="
              text-xs
              uppercase
              tracking-wide
              text-muted-foreground
            ">

              Developer

            </p>


            <div className="
              mt-1
              flex
              items-center
              gap-2
              font-medium
            ">


              <Building2 className="h-4 w-4"/>

              <span className="truncate">
  {property.developer}
</span>


            </div>


          </div>







          <div>

            <p className="
              text-xs
              uppercase
              tracking-wide
              text-muted-foreground
            ">

              Buyer Matches

            </p>


            <div className="
              mt-1
              flex
              items-center
              gap-2
              font-medium
            ">


              <Users className="h-4 w-4"/>

              {property.buyerMatches}


            </div>


          </div>








          <div>

            <p className="
              text-xs
              uppercase
              tracking-wide
              text-muted-foreground
            ">

              Last Shared

            </p>


            <div className="
              mt-1
              flex
              items-center
              gap-2
              font-medium
            ">


              <CalendarDays className="h-4 w-4"/>

              {property.lastShared}


            </div>


          </div>




        </div>



      </div>







      <ChevronRight className="
        mt-4
        h-5
        w-5
        shrink-0
        text-muted-foreground
        transition-transform
        duration-200
        group-hover:translate-x-1
        sm:mt-2
        sm:ml-4
      "/>


    </Link>

  )

}