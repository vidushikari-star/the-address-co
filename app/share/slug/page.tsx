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
  formatCurrencyCr,
} from "@/lib/formatters/currency"





type Props = {

  params: Promise<{
    slug:string
  }>

}





function DetailItem({
  label,
  value,
}:{
  label:string
  value:any
}){


  if(!value){
    return null
  }


  return (

    <div>

      <p className="text-sm text-muted-foreground">
        {label}
      </p>

      <p className="font-medium">
        {value}
      </p>

    </div>

  )

}








export default async function PublicPropertyPage({
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






  const images =
    await getPropertyImages(
      property.id
    )







  return (

    <main className="min-h-screen bg-background">


      {/* HERO */}


      <section className="relative">


        {
          property.coverImage && (

            <img

              src={
                property.coverImage
              }

              alt={
                property.name
              }

              className="h-[60vh] w-full object-cover"

            />

          )

        }



        <div className="absolute inset-0 bg-black/40" />



        <div className="absolute bottom-0 left-0 p-8 text-white">


          <h1 className="text-4xl font-bold">

            {property.name}

          </h1>


          <p className="mt-2 text-lg">

            {property.location}

          </p>



          <p className="mt-4 text-2xl font-semibold">

            {
              formatCurrencyCr(
                property.price.asking
              )
            }

          </p>


        </div>


      </section>









      <div className="mx-auto max-w-5xl space-y-10 p-8">








        {/* DESCRIPTION */}


        <section>


          <h2 className="text-2xl font-semibold">
            About the Property
          </h2>


          <p className="mt-4 whitespace-pre-line text-muted-foreground">

            {
              property.description ||
              "Please contact us for more details."
            }

          </p>


        </section>









        {/* DETAILS */}


        <section className="rounded-2xl border p-6">


          <h2 className="text-2xl font-semibold mb-6">
            Property Details
          </h2>



          <div className="grid gap-6 md:grid-cols-3">


            <DetailItem

              label="Property Type"

              value={
                property.propertyType
              }

            />



            <DetailItem

              label="Bedrooms"

              value={
                property.specifications.bedrooms
              }

            />



            <DetailItem

              label="Bathrooms"

              value={
                property.specifications.bathrooms
              }

            />



            <DetailItem

              label="Plot Area"

              value={
                property.specifications.plotArea
                  ? `${property.specifications.plotArea} sqm`
                  : null
              }

            />



            <DetailItem

              label="Built Up Area"

              value={
                property.specifications.builtUpArea
                  ? `${property.specifications.builtUpArea} sqft`
                  : null
              }

            />



            <DetailItem

              label="Furnishing"

              value={
                property.furnishing
              }

            />


          </div>


        </section>









        {/* AMENITIES */}


        {
          property.amenities &&
          property.amenities.length > 0 && (


            <section>


              <h2 className="text-2xl font-semibold mb-4">
                Amenities
              </h2>



              <div className="flex flex-wrap gap-3">


                {
                  property.amenities.map(

                    amenity => (

                      <span

                        key={
                          amenity
                        }

                        className="rounded-full border px-4 py-2"

                      >

                        {amenity}

                      </span>

                    )

                  )

                }


              </div>


            </section>


          )

        }









        {/* GALLERY */}


        {
          images.length > 0 && (


            <section>


              <h2 className="text-2xl font-semibold mb-4">
                Gallery
              </h2>



              <div className="grid gap-4 md:grid-cols-3">


                {
                  images.map(

                    image => (

                      <img

                        key={
                          image.id
                        }

                        src={
                          image.url
                        }

                        alt={
                          property.name
                        }

                        className="h-64 w-full rounded-xl object-cover"

                      />

                    )

                  )

                }


              </div>


            </section>


          )

        }









        {/* LOCATION */}


        {
          property.googleMapLink && (


            <section>


              <a

                href={
                  property.googleMapLink
                }

                target="_blank"

                className="inline-flex rounded-xl bg-primary px-6 py-3 text-white"

              >

                View Location

              </a>


            </section>


          )

        }









        {/* CTA */}


        <section className="rounded-2xl bg-muted p-8 text-center">


          <h2 className="text-2xl font-semibold">

            Interested in this property?

          </h2>



          <p className="mt-2 text-muted-foreground">

            Contact us to schedule a private viewing.

          </p>



          <a

            href="https://wa.me/919999999999"

            target="_blank"

            className="mt-5 inline-block rounded-xl bg-primary px-6 py-3 text-white"

          >

            Schedule Viewing

          </a>


        </section>



      </div>


    </main>

  )

}