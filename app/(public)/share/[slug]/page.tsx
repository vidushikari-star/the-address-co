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
  ADVISORS,
} from "@/lib/config/advisors"

import {
  PropertyEnquiryForm,
} from "@/components/public/property-enquiry-form"





type Props = {

  params: Promise<{
    slug:string
  }>

}





export default async function PublicPropertySharePage({

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



  const coverImage =
    images[0]?.url ||
    property.coverImage





  const advisor =

    ADVISORS[property.advisor]

    ||

    ADVISORS["Vidushi Kari"]





  const advisorName =

    advisor?.name

    ||

    property.advisor

    ||

    "Advisor"





  const whatsappMessage =

`Hi ${advisorName},

I am interested in:

${property.name}

Please share more details.`





  const whatsappUrl =

    advisor?.whatsapp

      ? `https://wa.me/${advisor.whatsapp}?text=${encodeURIComponent(
          whatsappMessage
        )}`

      : "#"









  return (

    <main className="min-h-screen bg-background">





      {/* HERO */}


      <section className="relative h-[75vh] w-full">


        {
          coverImage && (

            <img

              src={coverImage}

              alt={property.name}

              className="absolute inset-0 h-full w-full object-cover"

            />

          )
        }





        <div className="absolute inset-0 bg-black/40" />





        <div className="relative z-10 flex h-full items-end">


          <div className="mx-auto w-full max-w-6xl px-6 pb-12 text-white">


            <p className="mb-3 text-sm uppercase tracking-[0.3em]">

              Luxury Property

            </p>




            <h1 className="text-5xl font-semibold">

              {property.name}

            </h1>




            <p className="mt-3 text-xl">

              {property.location}

            </p>



            <div className="mt-6 inline-block rounded-xl bg-white/20 px-6 py-3 backdrop-blur">


              <p className="text-sm">
                Asking Price
              </p>


              <p className="text-3xl font-semibold">

                ₹
                {
                  property.price.asking.toLocaleString(
                    "en-IN"
                  )
                }

              </p>


            </div>


          </div>


        </div>


      </section>









      {/* PROPERTY STATS */}


      <section className="mx-auto grid max-w-6xl gap-5 px-6 py-10 md:grid-cols-4">


        <Stat
          label="Property Type"
          value={property.propertyType}
        />


        <Stat
          label="Bedrooms"
          value={
            property.specifications.bedrooms || "-"
          }
        />


        <Stat
          label="Built-up Area"
          value={
            `${property.specifications.builtUpArea || "-"} sqft`
          }
        />



        <Stat
          label="Plot Area"
          value={
            `${property.specifications.plotArea || "-"} sqm`
          }
        />


      </section>









      {/* GALLERY */}


      {
        images.length > 0 && (

          <section className="mx-auto max-w-6xl px-6">


            <h2 className="mb-5 text-3xl font-semibold">
              Gallery
            </h2>



            <div className="grid gap-4 md:grid-cols-3">


              {
                images.map(

                  image => (

                    <img

                      key={image.id}

                      src={image.url}

                      alt={property.name}

                      className="h-72 w-full rounded-2xl object-cover"

                    />

                  )

                )

              }


            </div>


          </section>

        )

      }









      {/* DESCRIPTION */}


      <section className="mx-auto max-w-6xl px-6 py-12">


        <div className="rounded-3xl border p-8">


          <h2 className="mb-4 text-3xl font-semibold">

            About the Property

          </h2>



          <p className="whitespace-pre-line text-lg text-muted-foreground">

            {
              property.description ||
              "-"
            }

          </p>


        </div>


      </section>









      {/* AMENITIES */}


      <section className="mx-auto max-w-6xl px-6 pb-12">


        <div className="rounded-3xl border p-8">


          <h2 className="mb-5 text-3xl font-semibold">

            Amenities

          </h2>



          <div className="flex flex-wrap gap-3">


            {
              property.amenities?.map(

                item => (

                  <span

                    key={item}

                    className="rounded-full border px-5 py-2"

                  >

                    {item}

                  </span>

                )

              )

            }


          </div>


        </div>


      </section>









      {/* ENQUIRY FORM */}


      <section className="mx-auto max-w-6xl px-6 pb-12">


        <PropertyEnquiryForm

          property={
            property
          }

        />


      </section>









      {/* WHATSAPP CTA */}


      <section className="bg-muted py-12">


        <div className="mx-auto max-w-6xl px-6 text-center">


          <h2 className="text-3xl font-semibold">

            Interested in this property?

          </h2>



          <p className="mt-3 text-muted-foreground">

            Contact {advisorName} for a private viewing.

          </p>





          <a

            href={whatsappUrl}

            target="_blank"

            className="mt-6 inline-block rounded-xl bg-primary px-8 py-3 text-white"

          >

            WhatsApp {advisorName}

          </a>


        </div>


      </section>


    </main>

  )

}








function Stat({

  label,

  value,

}:{

  label:string

  value:any

}){


  return (

    <div className="rounded-2xl border p-6">


      <p className="text-sm text-muted-foreground">

        {label}

      </p>


      <p className="mt-2 text-xl font-semibold">

        {value}

      </p>


    </div>

  )

}