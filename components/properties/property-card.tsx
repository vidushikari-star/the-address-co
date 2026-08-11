import Link from "next/link"
import Image from "next/image"

import {
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  ChevronRight,
  MapPin,
  Ruler,
  Users,
} from "lucide-react"

import { StatusBadge } from "@/components/shared/status-badge"

import { PropertyLabelBadges } from "@/components/properties/property-label-badges"

import {
  formatExactPropertyPrice,
} from "@/lib/utils/format-currency"

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
        block
        overflow-hidden
        rounded-3xl
        border
        border-border/60
        bg-card
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-primary/20
        hover:bg-background
        hover:shadow-lg
        active:scale-[0.99]
      "
    >

      {/* Mobile Layout */}

      <div className="block lg:hidden">

        <div className="relative aspect-[16/10] overflow-hidden bg-muted">

          {property.coverImage ? (

  property.coverImage.includes(".mp4") ? (

    <video
      src={property.coverImage}
      muted
      autoPlay
      loop
      playsInline
      preload="metadata"
      className="
        h-full
        w-full
        object-cover
        transition-transform
        duration-500
        group-hover:scale-105
      "
    />

  ) : (

    <Image
      src={property.coverImage}
      alt={property.name}
      width={960}
      height={600}
      sizes="(max-width: 1024px) 100vw, 288px"
      className="
        h-full
        w-full
        object-cover
        transition-transform
        duration-500
        group-hover:scale-105
      "
    />

  )

) : (
            <div
              className="
                flex
                h-full
                items-center
                justify-center
                text-sm
                text-muted-foreground
              "
            >
              No Image
            </div>
          )}

          <div className="absolute left-4 top-4">
            <StatusBadge status={property.status} />
          </div>

        </div>

          <div className="space-y-5 p-5">

          <div className="space-y-2">

            <div className="flex items-start justify-between gap-3">

              <div className="min-w-0 flex-1">

                <h3
                  className="
                    line-clamp-2
                    text-xl
                    font-semibold
                    leading-tight
                  "
                >
                  {property.name}
                </h3>

                <div
                  className="
                    mt-2
                    flex
                    items-center
                    gap-1.5
                    text-sm
                    text-muted-foreground
                  "
                >
                  <MapPin className="h-4 w-4 shrink-0" />

                  <span className="truncate">
                    {property.location}
                  </span>

                </div>

              </div>

            </div>

            <p
  className="
    text-3xl
    font-bold
    tracking-tight
    text-primary
  "
>
  {formatExactPropertyPrice(
    property.transactionType === "Rental"
      ? property.price.rent
      : property.price.asking,
    property.transactionType
  )}
</p>

            <PropertyLabelBadges property={property} />

          </div>

          <div
            className="
              grid
              grid-cols-3
              gap-3
              rounded-2xl
              bg-muted/40
              p-4
            "
          >

            <div className="flex flex-col items-center gap-1">

              <BedDouble className="h-5 w-5 text-muted-foreground" />

              <span className="text-sm font-medium">
                {property.specifications.bedrooms}
              </span>

              <span className="text-xs text-muted-foreground">
                Beds
              </span>

            </div>

            <div className="flex flex-col items-center gap-1">

              <Bath className="h-5 w-5 text-muted-foreground" />

              <span className="text-sm font-medium">
                {property.specifications.bathrooms}
              </span>

              <span className="text-xs text-muted-foreground">
                Baths
              </span>

            </div>

            <div className="flex flex-col items-center gap-1">

              <Ruler className="h-5 w-5 text-muted-foreground" />

              <span className="text-sm font-medium">
                {property.specifications.builtUpArea
  ? property.specifications.builtUpArea.toLocaleString()
  : property.specifications.carpetArea?.toLocaleString()
}
              </span>

              <span className="text-xs text-muted-foreground">
                sqft Built-up
              </span>

              {property.specifications.plotArea && (
  <span>
    Plot: {property.specifications.plotArea.toLocaleString()} sqm
  </span>
)}

            </div>

          </div>
                    <div className="space-y-4">

            <div className="grid grid-cols-2 gap-4">

              <div>

                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Developer
                </p>

                <div className="mt-1 flex items-center gap-2">

                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <span className="truncate text-sm font-medium">
                    {property.developer}
                  </span>

                </div>

              </div>

              <div>

                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Buyer Matches
                </p>

                <div className="mt-1 flex items-center gap-2">

                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />

                  <span className="font-medium">
                    {property.buyerMatches}
                  </span>

                </div>

              </div>

            </div>

            <div>

              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Last Shared
              </p>

              <div className="mt-1 flex items-center gap-2">

                <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />

                <span className="font-medium">
                  {property.lastShared}
                </span>

              </div>

            </div>

          </div>

          <div
            className="
              flex
              items-center
              justify-between
              border-t
              pt-4
            "
          >

            <span
              className="
                text-sm
                font-medium
                text-primary
                transition-colors
                group-hover:text-primary
              "
            >
              View Property
            </span>

            <ChevronRight
              className="
                h-5
                w-5
                text-muted-foreground
                transition-transform
                duration-300
                group-hover:translate-x-1
              "
            />

          </div>

        </div>

      </div>

      {/* Desktop Layout */}

      <div className="hidden lg:flex">

        <div
          className="
            h-56
            w-72
            shrink-0
            overflow-hidden
            bg-muted
          "
        >

          {property.coverImage ? (

  property.coverImage.includes(".mp4") ? (

    <video
      src={property.coverImage}
      muted
      autoPlay
      loop
      playsInline
      preload="metadata"
      className="
        h-full
        w-full
        object-cover
        transition-transform
        duration-500
        group-hover:scale-105
      "
    />

  ) : (

    <Image
      src={property.coverImage}
      alt={property.name}
      width={576}
      height={448}
      sizes="288px"
      className="
        h-full
        w-full
        object-cover
        transition-transform
        duration-500
        group-hover:scale-105
      "
    />

  )

) : (

            <div
              className="
                flex
                h-full
                items-center
                justify-center
                text-muted-foreground
              "
            >
              No Image
            </div>

          )}

        </div>

       <div
  className="
    flex
    flex-1
    flex-col
    p-7
  "
>
                  <div className="flex items-start justify-between gap-6">

            <div className="min-w-0 flex-1">

              <div className="flex items-center gap-3">

                <h3 className="truncate text-2xl font-semibold tracking-tight">
                  {property.name}
                </h3>

                <StatusBadge status={property.status} />

              </div>

              <div className="mt-2 flex items-center gap-2 text-muted-foreground">

                <MapPin className="h-4 w-4 shrink-0" />

                <span>{property.location}</span>

              </div>

              <PropertyLabelBadges property={property} className="mt-3" />

            </div>

            <p className="shrink-0 text-4xl font-bold tracking-tight text-primary">
  {formatExactPropertyPrice(
  property.transactionType === "Rental"
    ? property.price.rent
    : property.price.asking,
  property.transactionType
)}
</p>

          </div>

          <div
            className="
              mt-8
              grid
              grid-cols-3
              gap-5
              rounded-2xl
              bg-muted/40
              p-5
            "
          >

            <div className="flex items-center gap-3">

              <BedDouble className="h-5 w-5 text-muted-foreground" />

              <div>

                <p className="text-lg font-semibold">
                  {property.specifications.bedrooms}
                </p>

                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Bedrooms
                </p>

              </div>

            </div>

            <div className="flex items-center gap-3">

              <Bath className="h-5 w-5 text-muted-foreground" />

              <div>

                <p className="text-lg font-semibold">
                  {property.specifications.bathrooms}
                </p>

                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Bathrooms
                </p>

              </div>

            </div>

            <div className="flex items-center gap-3">

  <Ruler className="h-5 w-5 text-muted-foreground" />

  <div>

    <p className="text-lg font-semibold">
      {property.specifications.builtUpArea
        ? property.specifications.builtUpArea.toLocaleString()
        : property.specifications.carpetArea?.toLocaleString()
      }
    </p>

    <p className="text-xs uppercase tracking-wide text-muted-foreground">
      Sqft Built-up
    </p>

    {property.specifications.plotArea && (
      <p className="text-xs text-muted-foreground mt-1">
        Plot: {property.specifications.plotArea.toLocaleString()} sqm
      </p>
    )}

  </div>

</div>

          </div>

          <div
            className="
              mt-8
              grid
              grid-cols-3
              gap-6
              border-t
              pt-6
            "
          >

            <div>

              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Developer
              </p>

              <div className="mt-2 flex items-center gap-2">

                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />

                <span className="truncate font-medium">
                  {property.developer}
                </span>

              </div>

            </div>

            <div>

              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Buyer Matches
              </p>

              <div className="mt-2 flex items-center gap-2">

                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />

                <span className="font-medium">
                  {property.buyerMatches}
                </span>

              </div>

            </div>

            <div>

              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Last Shared
              </p>

              <div className="mt-2 flex items-center gap-2">

                <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />

                <span className="font-medium">
                  {property.lastShared}
                </span>

              </div>

            </div>

          </div>

          <div className="mt-auto flex justify-end pt-8">

            <ChevronRight
              className="
                h-6
                w-6
                text-muted-foreground
                transition-transform
                duration-300
                group-hover:translate-x-1
              "
            />

          </div>

        </div>

      </div>

    </Link>
  )
}
