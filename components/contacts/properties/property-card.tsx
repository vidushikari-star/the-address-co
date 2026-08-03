import Link from "next/link"

import type { Property } from "@/types/property"

import {
  ArrowUpRight,
  BedDouble,
  Building2,
  MapPin,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  formatExactPropertyPrice,
} from "@/lib/utils/format-currency"



type PropertyCardProps = {
  property: Property
}





export function PropertyCard({
  property,
}: PropertyCardProps) {


  const displayPrice =
    property.transactionType === "Rental"
      ? property.price.rent
      : property.price.asking





  return (

    <div className="rounded-lg border p-4 transition-colors hover:bg-muted/40">


      <div className="flex items-start justify-between">


        <div>


          <h3 className="font-medium">

            {property.name}

          </h3>



          <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">

            <MapPin className="h-3.5 w-3.5" />

            {property.locality}, {property.location}

          </div>


        </div>




        <Badge variant="secondary">

          {property.status.replace("_", " ")}

        </Badge>


      </div>





      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">


        <div className="flex items-center gap-2">


          <Building2 className="h-4 w-4" />


          {
            formatExactPropertyPrice(
              displayPrice,
              property.transactionType
            )
          }


        </div>




        <div className="flex items-center gap-2">


          <BedDouble className="h-4 w-4" />


          {property.specifications.bedrooms} BHK


        </div>


      </div>





      {property.tags?.length ? (

        <div className="mt-4 flex flex-wrap gap-2">


          {property.tags.map((tag) => (

            <Badge

              key={tag}

              variant="outline"

            >

              {tag}

            </Badge>

          ))}


        </div>

      ) : null}






      <div className="mt-4 flex justify-end">


        <Link href={`/properties/${property.slug}`}>


          <Button

            variant="ghost"

            size="icon"

          >

            <ArrowUpRight className="h-4 w-4" />


          </Button>


        </Link>


      </div>



    </div>

  )

}