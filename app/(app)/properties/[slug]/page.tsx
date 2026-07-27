import Link from "next/link"

import {
  notFound,
} from "next/navigation"

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
  formatCurrencyCr,
} from "@/lib/formatters/currency"

import {
  StatusBadge,
} from "@/components/shared/status-badge"

import {
  SharePropertyButton,
} from "@/components/properties/share-property-button"

import {
  getActivitiesByPropertyId,
} from "@/lib/repositories/activity-repository"

import {
  PropertyActivityTimeline,
} from "@/components/properties/property-activity-timeline"

import {
  PropertyGallery,
} from "@/components/properties/property-gallery"

import {
  PropertyImageUpload,
} from "@/components/properties/property-image-upload"

import {
  PropertyDocuments,
} from "@/components/properties/property-documents"




type Props = {

  params: Promise<{
    slug:string
  }>

}





function DetailRow({
  label,
  value,
}:{
  label:string
  value:any
}){


  return (

    <div>

      <p className="text-sm text-muted-foreground">
        {label}
      </p>


      <p className="font-medium">
        {value || "-"}
      </p>

    </div>

  )

}








export default async function PropertyDetailPage({
  params,
}:Props){


  const {
    slug,
  } =
  await params





  const property =
    await getPropertyBySlug(
      slug
    )





  if(!property){

    notFound()

  }






  const [
    activities,
    images,
    documents,
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


  ])









  return (

    <div className="space-y-8 p-8">





      {/* HEADER */}

      <div className="flex items-start justify-between">


        <div>


          <h1 className="text-3xl font-semibold">
            {property.name}
          </h1>



          <p className="mt-2 text-muted-foreground">
            {property.developer}
          </p>



          <p className="mt-1 text-sm text-muted-foreground">
            {property.location}
          </p>


        </div>







        <div className="flex gap-3 items-center">


          <StatusBadge
            status={property.status}
          />



          <SharePropertyButton

            property={
              property
            }

          />



          <Link

            href={`/properties/${property.slug}/edit`}

            className="rounded-md bg-primary px-4 py-2 text-sm text-white"

          >

            Edit Property

          </Link>


        </div>


      </div>









      {/* IMAGES */}


      <section className="rounded-2xl border p-6 space-y-5">


        <div className="flex items-center justify-between">


          <h2 className="text-xl font-semibold">
            Property Images
          </h2>



          <PropertyImageUpload

            propertyId={
              property.id
            }

          />


        </div>





        <PropertyGallery

          propertyId={
            property.id
          }

          images={
            images
          }

        />


      </section>









      {/* DOCUMENTS */}


      <PropertyDocuments

  documents={
    documents
  }

  propertyId={
    property.id
  }

/>









      {/* DESCRIPTION */}


      <section className="rounded-2xl border p-6">


        <h2 className="text-xl font-semibold mb-3">
          About the Property
        </h2>



        <p className="text-muted-foreground whitespace-pre-line">

          {
            property.description ||
            "No description added."
          }

        </p>


      </section>









      <div className="grid gap-6 md:grid-cols-3">





        <div className="rounded-2xl border p-6 space-y-5">


          <h2 className="text-xl font-semibold">
            Property Details
          </h2>



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









        <div className="rounded-2xl border p-6 space-y-5">


          <h2 className="text-xl font-semibold">
            Specifications
          </h2>



          <DetailRow

            label="Bedrooms"

            value={
              property.specifications.bedrooms
            }

          />



          <DetailRow

            label="Bathrooms"

            value={
              property.specifications.bathrooms
            }

          />



          <DetailRow

            label="Carpet Area"

            value={
              `${property.specifications.carpetArea} sqft`
            }

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









        <div className="rounded-2xl border p-6 space-y-5">


          <h2 className="text-xl font-semibold">
            Financials
          </h2>



          <DetailRow

            label="Asking Price"

            value={
              formatCurrencyCr(
                property.price.asking
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


      </div>









      {/* AMENITIES */}


      <section className="rounded-2xl border p-6">


        <h2 className="text-xl font-semibold mb-4">
          Amenities
        </h2>



        {
          property.amenities &&
          property.amenities.length > 0 ? (


            <div className="flex flex-wrap gap-3">


              {
                property.amenities.map(

                  amenity => (

                    <span

                      key={
                        amenity
                      }

                      className="rounded-full border px-4 py-2 text-sm"

                    >

                      {amenity}

                    </span>

                  )

                )

              }


            </div>


          ) : (


            <p className="text-muted-foreground">
              No amenities added.
            </p>


          )

        }


      </section>









      {/* LOCATION */}


      {
        property.googleMapLink && (


          <section className="rounded-2xl border p-6">


            <h2 className="text-xl font-semibold mb-3">
              Location
            </h2>



            <a

              href={
                property.googleMapLink
              }

              target="_blank"

              className="text-primary underline"

            >

              Open Google Maps

            </a>


          </section>


        )

      }









      {/* NOTES */}


      <section className="rounded-2xl border p-6">


        <h2 className="text-xl font-semibold mb-3">
          Internal Notes
        </h2>



        <p className="text-muted-foreground">

          {
            property.note ||
            "-"
          }

        </p>


      </section>









      {/* ACTIVITY */}


      <section className="rounded-2xl border p-6 space-y-4">


        <h2 className="text-xl font-semibold">
          Activity Timeline
        </h2>



        <PropertyActivityTimeline

          activities={
            activities
          }

        />


      </section>


    </div>

  )

}