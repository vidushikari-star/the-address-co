import {
  Building2,
  Briefcase,
  Home,
  MapPin,
  Sofa,
  Tag,
  TrendingUp,
} from "lucide-react"

import {
  formatExactPropertyPrice,
} from "@/lib/utils/format-currency"

import type {
  Property,
} from "@/types/property"


type PropertyOverviewProps = {
  property: Property
}


type DetailItemProps = {
  icon: React.ReactNode
  label: string
  value?: string | number | null
}



function DetailItem({
  icon,
  label,
  value,
}: DetailItemProps) {

  return (

    <div
      className="
        flex
        items-start
        gap-3
        rounded-2xl
        border
        bg-card
        p-4
      "
    >

      <div
        className="
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-primary/10
          text-primary
        "
      >

        {icon}

      </div>



      <div className="min-w-0">

        <p className="text-sm text-muted-foreground">
          {label}
        </p>


        <p className="mt-1 font-semibold break-words">
          {value || "—"}
        </p>

      </div>


    </div>

  )

}




export function PropertyOverview({
  property,
}: PropertyOverviewProps) {


  const displayPrice =
    property.transactionType === "Rental"
      ? property.price.rent
      : property.price.asking



  return (

    <section className="space-y-5">


      <div>

        <h2 className="text-xl font-semibold">
          Property Overview
        </h2>


        <p className="mt-1 text-sm text-muted-foreground">
          Essential information about this listing.
        </p>

      </div>





      <div
        className="
          grid
          gap-4
          md:grid-cols-2
        "
      >


        <DetailItem
          icon={<Building2 className="h-5 w-5" />}
          label="Developer"
          value={property.developer}
        />



        <DetailItem
          icon={<Home className="h-5 w-5" />}
          label="Property Type"
          value={property.propertyType}
        />



        <DetailItem
          icon={<TrendingUp className="h-5 w-5" />}
          label="Development Stage"
          value={property.developmentStage}
        />



        <DetailItem
          icon={<Briefcase className="h-5 w-5" />}
          label="Transaction Type"
          value={property.transactionType}
        />



        <DetailItem
          icon={<Tag className="h-5 w-5" />}
          label="Listing Type"
          value={property.listingType}
        />



        <DetailItem
          icon={<MapPin className="h-5 w-5" />}
          label="Locality"
          value={property.locality}
        />



        <DetailItem
          icon={<Sofa className="h-5 w-5" />}
          label="Furnishing"
          value={property.furnishing}
        />



        <DetailItem
          icon={<TrendingUp className="h-5 w-5" />}
          label={
            property.transactionType === "Rental"
              ? "Monthly Rent"
              : "Asking Price"
          }
          value={
            formatExactPropertyPrice(
              displayPrice,
              property.transactionType
            )
          }
        />


      </div>





      <div
        className="
          rounded-3xl
          border
          bg-card
          p-6
        "
      >

        <h3 className="text-lg font-semibold">
          About this Property
        </h3>


        <p
          className="
            mt-4
            whitespace-pre-line
            leading-7
            text-muted-foreground
          "
        >

          {
            property.description ||
            "No description has been added yet."
          }

        </p>


      </div>


    </section>

  )

}