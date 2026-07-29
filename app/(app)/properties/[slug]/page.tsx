import Link from "next/link"

import { notFound } from "next/navigation"

import {
  getPropertyBySlug,
} from "@/lib/repositories/property-repository"

import {
  getPropertyImages,
} from "@/lib/repositories/property-image-repository"

import {
  getPropertyDocuments,
} from "@/lib/repositories/property-document-repository"

import {
  getActivitiesByPropertyId,
} from "@/lib/repositories/activity-repository"

import {
  formatCurrencyCr,
} from "@/lib/formatters/currency"

import {
  PropertyActivityTimeline,
} from "@/components/properties/property-activity-timeline"

import {
  PropertyDocuments,
} from "@/components/properties/property-documents"

import {
  PropertyGallery,
} from "@/components/properties/property-gallery"

import {
  PropertyImageUpload,
} from "@/components/properties/property-image-upload"

import {
  SharePropertyButton,
} from "@/components/properties/share-property-button"

import {
  StatusBadge,
} from "@/components/shared/status-badge"

type Props = {
  params: Promise<{
    slug: string
  }>
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="text-sm font-medium">
        {value || "-"}
      </p>
    </div>
  )
}

export default async function PropertyDetailPage({
  params,
}: Props) {
  const { slug } = await params

  const property =
    await getPropertyBySlug(slug)

  if (!property) {
    notFound()
  }

  const [
    activities,
    images,
    documents,
  ] = await Promise.all([
    getActivitiesByPropertyId(
      property.id
    ),
    getPropertyImages(
      property.id
    ),
    getPropertyDocuments(
      property.id
    ),
  ])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 sm:p-6 lg:p-8">

      {/* Hero */}

      <section className="overflow-hidden rounded-3xl border bg-card">

        <div className="bg-gradient-to-r from-primary/5 via-background to-background p-6 sm:p-8">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div className="min-w-0 flex-1">

              <div className="mb-4 flex flex-wrap items-center gap-3">

                <StatusBadge
                  status={property.status}
                />

                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {property.propertyType}
                </span>

              </div>

              <h1 className="break-words text-3xl font-bold tracking-tight sm:text-4xl">
                {property.name}
              </h1>

              <p className="mt-3 text-4xl font-bold text-primary">
                {formatCurrencyCr(
                  property.price.asking
                )}
              </p>

              <div className="mt-5 space-y-1 text-muted-foreground">

                <p className="font-medium">
                  {property.developer}
                </p>

                <p>
                  {property.location}
                </p>

              </div>

            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">

              <SharePropertyButton
                property={property}
              />

              <Link
                href={`/properties/${property.slug}/edit`}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >
                Edit Property
              </Link>

            </div>

          </div>

        </div>

      </section>

      {/* Images */}

      <section className="rounded-3xl border bg-card">

        <div className="flex flex-col gap-4 border-b p-6 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <h2 className="text-xl font-semibold">
              Property Images
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Upload, manage and choose the cover image.
            </p>

          </div>

          <PropertyImageUpload
            propertyId={property.id}
          />

        </div>

        <div className="p-6">

          <PropertyGallery
            propertyId={property.id}
            images={images}
          />

        </div>

      </section>

      {/* Documents */}

      <PropertyDocuments
        documents={documents}
        propertyId={property.id}
      />

      {/* Overview */}

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">

        <section className="rounded-3xl border bg-card p-6">

          <h2 className="text-xl font-semibold">
            About the Property
          </h2>

          <p className="mt-5 whitespace-pre-line leading-7 text-muted-foreground">
            {property.description ||
              "No description added."}
          </p>

        </section>

        <section className="rounded-3xl border bg-card p-6">

          <h2 className="text-xl font-semibold">
            Financials
          </h2>

          <div className="mt-6 space-y-6">

            <DetailRow
              label="Asking Price"
              value={formatCurrencyCr(
                property.price.asking
              )}
            />

            <DetailRow
              label="Advisor"
              value={property.advisor}
            />

          </div>

        </section>

      </div>

      {/* Details */}

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">

        <section className="rounded-3xl border bg-card p-6">

          <h2 className="mb-6 text-xl font-semibold">
            Property Details
          </h2>

          <div className="space-y-5">

            <DetailRow
              label="Transaction Type"
              value={property.transactionType}
            />

            <DetailRow
              label="Property Type"
              value={property.propertyType}
            />

            <DetailRow
              label="Listing Type"
              value={property.listingType}
            />

            <DetailRow
              label="Development Stage"
              value={property.developmentStage}
            />

            <DetailRow
              label="Location"
              value={property.location}
            />

            <DetailRow
              label="Locality"
              value={property.locality}
            />

            <DetailRow
              label="Furnishing"
              value={property.furnishing}
            />

          </div>

        </section>
                <section className="rounded-3xl border bg-card p-6">

          <h2 className="mb-6 text-xl font-semibold">
            Specifications
          </h2>

          <div className="space-y-5">

            <DetailRow
              label="Bedrooms"
              value={property.specifications.bedrooms}
            />

            <DetailRow
              label="Bathrooms"
              value={property.specifications.bathrooms}
            />

            <DetailRow
              label="Carpet Area"
              value={`${property.specifications.carpetArea} sqft`}
            />

            <DetailRow
              label="Plot Area"
              value={
                property.specifications.plotArea
                  ? `${property.specifications.plotArea} sqm`
                  : "-"
              }
            />

            <DetailRow
              label="Built Up Area"
              value={
                property.specifications.builtUpArea
                  ? `${property.specifications.builtUpArea} sqft`
                  : "-"
              }
            />

          </div>

        </section>

        <section className="rounded-3xl border bg-card p-6">

          <h2 className="mb-6 text-xl font-semibold">
            Amenities
          </h2>

          {property.amenities &&
          property.amenities.length > 0 ? (

            <div className="flex flex-wrap gap-2">

              {property.amenities.map(
                (amenity) => (
                  <span
                    key={amenity}
                    className="rounded-full border bg-muted/40 px-3 py-2 text-sm font-medium"
                  >
                    {amenity}
                  </span>
                )
              )}

            </div>

          ) : (

            <p className="text-sm text-muted-foreground">
              No amenities added.
            </p>

          )}

        </section>

      </div>

      {property.tags &&
        property.tags.length > 0 && (

          <section className="rounded-3xl border bg-card p-6">

            <h2 className="text-xl font-semibold">
              Tags
            </h2>

            <div className="mt-5 flex flex-wrap gap-2">

              {property.tags.map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-full border bg-primary/5 px-3 py-2 text-sm"
                  >
                    {tag}
                  </span>
                )
              )}

            </div>

          </section>

        )}

      {property.googleMapLink && (

        <section className="rounded-3xl border bg-card p-6">

          <h2 className="text-xl font-semibold">
            Location
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
  Open the property&apos;s location in Google Maps.
</p>

          <a
            href={property.googleMapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-medium transition hover:bg-muted"
          >
            Open Google Maps
          </a>

        </section>

      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">

        <section className="rounded-3xl border bg-card p-6">

          <h2 className="text-xl font-semibold">
            Internal Notes
          </h2>

          <p className="mt-5 whitespace-pre-line leading-7 text-muted-foreground">
            {property.note || "-"}
          </p>

        </section>

        <section className="rounded-3xl border bg-card p-6">

          <h2 className="text-xl font-semibold">
            Activity Timeline
          </h2>

          <div className="mt-6">

            <PropertyActivityTimeline
              activities={activities}
            />

          </div>

        </section>

      </div>

    </div>
  )
}