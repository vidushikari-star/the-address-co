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
  PropertyEnquiryForm,
} from "@/components/public/property-enquiry-form"

import type { ReactNode } from "react"

import {
  formatPropertyPrice,
} from "@/lib/utils/format-currency"

import {
  supabase,
} from "@/lib/supabase/client"


type Props = {

  params: Promise<{
    slug:string
  }>

  searchParams: Promise<{
    advisor?: string
  }>

}





export default async function PublicPropertySharePage({

  params,

  searchParams,

}:Props){


  const {
    slug,
  } =
  await params

  const {
  advisor: advisorId,
} =
await searchParams





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





  const displayPrice =
    property.transactionType === "Rental"
      ? property.price.rent
      : property.price.asking





  const {
  data: sharedAdvisor,
} =
  advisorId
    ? await supabase
        .from("user_profiles")
        .select(
          "id,name,phone,whatsapp"
        )
        .eq(
          "id",
          advisorId
        )
        .single()
    : {
        data: null,
      }



const advisorName =
  sharedAdvisor?.name
  ||
  "Vidushi Kari"



const advisorWhatsapp =
  (
    sharedAdvisor?.whatsapp ??
    sharedAdvisor?.phone ??
    ""
  )





  const whatsappMessage =

`Hi ${advisorName},

I am interested in:

${property.name}

Please share more details.`





 const whatsappUrl =

    advisorWhatsapp

      ? `https://wa.me/${advisorWhatsapp}?text=${encodeURIComponent(
          whatsappMessage
        )}`

      : "#"









  return (

    <main className="min-h-screen bg-background">


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




            <div className="mt-6 inline-block rounded-xl bg-white/20 px-6 py-4 backdrop-blur">


  <p className="text-sm">

    {
      property.transactionType === "Rental"
        ? "Monthly Rent"
        : "Asking Price"
    }

  </p>


  <p className="text-3xl font-semibold">

    {
      formatPropertyPrice(
        displayPrice,
        property.transactionType
      )
    }

  </p>





  {
    property.transactionType === "Rental" &&
    property.price.securityDeposit &&
    property.price.securityDeposit > 0 && (

      <div className="mt-3 border-t border-white/30 pt-3">


        <p className="text-sm">
          Security Deposit
        </p>


        <p className="text-xl font-semibold">

          {
            formatPropertyPrice(
              property.price.securityDeposit,
              "Sale"
            )
          }

        </p>


      </div>

    )
  }


</div>


          </div>


        </div>


      </section>









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









      <section className="mx-auto max-w-6xl px-6 pb-12">


        <PropertyEnquiryForm

  property={property}

  advisorId={advisorId}

/>


      </section>









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
}: {
  label:string
  value:ReactNode
}) {

  return (

    <div className="rounded-2xl border p-6">

      <p className="text-sm text-muted-foreground">
        {label}
      </p>


      <p className="mt-2 text-xl font-semibold">
        {value ?? "-"}
      </p>


    </div>

  )

}