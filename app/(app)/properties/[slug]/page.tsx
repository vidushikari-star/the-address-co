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
  formatExactPropertyPrice
} from "@/lib/utils/format-currency"

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

import {
  DeletePropertyButton,
} from "@/components/properties/delete-property-button"

import {
  ArchivePropertyButton,
} from "@/components/properties/archive-property-button"

import {
  PushHousingButton,
} from "@/components/properties/push-housing-button"

import {
  getDealsByPropertyId,
} from "@/lib/repositories/deal-repository"

import {
  PropertyDeals,
} from "@/components/properties/property-deals"

import {
  PropertyCreatedBanner,
} from "@/components/properties/property-created-banner"

import {
  HousingSyncStatus,
} from "@/components/properties/housing-sync-status"



type Props = {

  params: Promise<{
    slug:string
  }>

  searchParams: Promise<{
    created?: string
  }>

}



function DetailRow({
  label,
  value,
}:{
  label:string
  value?:string | number | null
}){

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
  searchParams,
}:Props){

  const {
  slug
} = await params


const {
  created,
} = await searchParams



  const property =
    await getPropertyBySlug(slug)



  if(!property){

    notFound()

  }



  const [
  activities,
  images,
  documents,
  deals,
] =
await Promise.all([

  getActivitiesByPropertyId(
    property.id
  ),

  getPropertyImages(
    property.id
  ),

  getPropertyDocuments(
    property.id
  ),

  getDealsByPropertyId(
    property.id
  ),

])





  return (

  <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 p-4 sm:p-6 lg:p-8">


  
      {
  created === "true" && (
    <PropertyCreatedBanner />
  )
}



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

                {
                  formatExactPropertyPrice(
  property.transactionType === "Rental"
    ? property.price.rent
    : property.price.asking,
  property.transactionType
)
                }

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

              <PushHousingButton
  property={property}
/>



              <Link
                href={`/properties/${property.slug}/edit`}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
              >

                Edit Property

              </Link>

              <ArchivePropertyButton
  propertyId={
    property.id
  }
/>




              <DeletePropertyButton
                propertyId={
                  property.id
                }
              />

              <HousingSyncStatus
  property={property}
/>


            </div>


          </div>


        </div>


      </section>





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


          <section id="gallery">

  <PropertyGallery
    propertyId={property.id}
    images={images}
  />

</section>


        </div>


      </section>





      <section id="documents">

  <PropertyDocuments
    documents={documents}
    propertyId={property.id}
  />

</section>

      <PropertyDeals
  deals={deals}
  transactionType={
    property.transactionType
  }
/>





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

              label={
                property.transactionType === "Rental"
                  ? "Monthly Rent"
                  : "Asking Price"
              }

              value={
                formatExactPropertyPrice(
  property.transactionType === "Rental"
    ? property.price.rent
    : property.price.asking,
  property.transactionType
)
              }

            />



            <DetailRow

              label="Advisor"

              value={
                property.advisor
              }

            />


          </div>


        </section>


      </div>





      {/* Remaining sections stay unchanged */}

    </div>

  )

}