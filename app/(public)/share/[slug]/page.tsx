import {
  notFound,
} from "next/navigation"
import Image from "next/image"
import { connection } from "next/server"

import {
  PropertyEnquiryForm,
} from "@/components/public/property-enquiry-form"

import type { ReactNode } from "react"

import {
  formatExactPropertyPrice
} from "@/lib/utils/format-currency"

import {
  getPublicPropertyShare,
} from "@/lib/public/property-share"

import {
  PublicHeader,
} from "@/components/public/public-header"

import {
LocationMapPreview,
} from "@/components/public/location-map-preview"

const documentCategoryLabels: Record<string,string> = {

  brochure:
    "Brochure",

  floor_plan:
    "Floor Plan",

  price_sheet:
    "Price Sheet",

  payment_plan:
    "Payment Plan",

}




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

  // A revoked share must never be served from a prerendered cache. The public
  // projection below is deliberately resolved only after an incoming request.
  await connection()

  const property =
    await getPublicPropertyShare(slug)



  if(!property){

    notFound()

  }

  const coverMedia =
  property.images.find(
    image => image.isCover
  )
  ||
  property.images[0]
  ||
  null


const coverUrl =
  coverMedia?.url


const coverType =
  coverMedia?.mediaType ||
  "image"




  const advisorWhatsapp =
    (
      property.advisor?.whatsapp ??
      property.advisor?.phone ??
      ""
    )
    .replace(
      /\D/g,
      ""
    )





  const whatsappMessage =

`Hi The Address Co,

I am interested in:

${property.title}

Please share more details.`





  const whatsappUrl =

    advisorWhatsapp

      ? `https://wa.me/${advisorWhatsapp}?text=${encodeURIComponent(
          whatsappMessage
        )}`

      : "#"









  return (

<main className="min-h-screen bg-background">

<PublicHeader />


      <section
  className="
    relative
    min-h-[75vh]
    w-full
    overflow-hidden
    bg-black
  "
>

  <div
    className="
      mx-auto
      grid
      min-h-[75vh]
      max-w-7xl
      items-center
      gap-10
      px-6
      py-12
      lg:grid-cols-2
    "
  >

    {/* Media */}
    <div
      className="
        order-1
        flex
        justify-center
        lg:order-2
      "
    >

      {
        coverUrl && coverType === "video" ? (

          <video

            src={coverUrl}

            autoPlay

            muted

            loop

            playsInline

            className="
              max-h-[70vh]
              w-auto
              max-w-full
              rounded-3xl
              object-contain
              shadow-2xl
            "

          />

        ) : coverUrl && (

          <Image
            src={coverUrl}
            alt={property.title}
            width={1600}
            height={1067}
            sizes="(max-width: 768px) 100vw, 80vw"

            className="
              max-h-[70vh]
              w-auto
              max-w-full
              rounded-3xl
              object-contain
              shadow-2xl
            "

          />

        )

      }

    </div>



    {/* Text */}
    <div
      className="
        order-2
        text-white
        lg:order-1
      "
    >

      <p
        className="
          mb-5
          text-sm
          uppercase
          tracking-[0.3em]
          text-white/70
        "
      >
        Luxury Property
      </p>


      <h1
        className="
          text-5xl
          font-semibold
          leading-tight
          md:text-6xl
        "
      >
        {property.title}
      </h1>


      <p className="mt-4 text-xl text-white/80">
        {property.location}
      </p>

      <LocationMapPreview

location={
property.location ?? ""
}

/>



      {
        property.price !== null && (

      <div
        className="
          mt-8
          inline-block
          rounded-2xl
          bg-white/10
          px-8
          py-6
          backdrop-blur
        "
      >

        <p className="text-sm text-white/70">

          {
          property.transactionType === "Rental"
              ? "Monthly Rent"
              : "Asking Price"
          }

        </p>


        <p className="mt-2 text-4xl font-semibold">

          {
            formatExactPropertyPrice(
              property.price,
              property.transactionType
            )
          }

        </p>



      </div>

        )
      }


    </div>


  </div>

</section>









      <section className="
        mx-auto
        grid
        max-w-6xl
        gap-5
        px-6
        py-10
        md:grid-cols-4
      ">


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
        property.images.length > 0 && (

          <section className="mx-auto max-w-6xl px-6">


            <h2 className="mb-5 text-3xl font-semibold">
              Gallery
            </h2>



            <div className="
              grid
              gap-4
              md:grid-cols-3
            ">


              {
  property.images.map(
    (image, index) => (

      <div
        key={`${image.url}-${index}`}
      >

        {
  image.mediaType === "video" ? (

    <div
      className="
        flex
        h-72
        w-full
        items-center
        justify-center
        overflow-hidden
        rounded-2xl
        bg-black
      "
    >

      <video
        src={image.url}
        controls
        preload="metadata"
        playsInline
        className="
          h-full
          w-auto
          object-contain
        "
      />

    </div>

  ) : (

    <Image
      src={image.url}
      alt={property.title}
      width={900}
      height={675}
      sizes="(max-width: 768px) 100vw, 50vw"
      className="
        h-72
        w-full
        rounded-2xl
        object-cover
      "
    />

  )
}

      </div>

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



          <p className="
            whitespace-pre-line
            text-lg
            text-muted-foreground
          ">

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

                    className="
                      rounded-full
                      border
                      px-5
                      py-2
                    "

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

        {
  property.documents.length > 0 && (

    <section
      className="
        mx-auto
        max-w-6xl
        px-6
        py-10
      "
    >

      <h2 className="mb-5 text-2xl font-semibold">
        Documents
      </h2>


      <div className="grid gap-4 md:grid-cols-3">

        {
          property.documents.map(
            (document, index) => (

              <a
                key={`${document.url}-${index}`}
                href={document.url}
                target="_blank"
                rel="noopener noreferrer"
                className="
                  rounded-xl
                  border
                  p-5
                  transition
                  hover:bg-muted
                "
              >

                <p className="font-medium">
                  {document.name}
                </p>


                <p className="
                  mt-2
                  text-sm
                  text-muted-foreground
                ">
                  {
  documentCategoryLabels[
    document.category
  ]
  ??
  document.category
}
{" • "}
{
  document.fileType?.includes("pdf")
    ? "PDF"
    : "File"
}
                </p>


              </a>

            )
          )

        }

      </div>

    </section>

  )
}


        <PropertyEnquiryForm

          shareToken={property.token}

          propertyTitle={property.title}

        />


      </section>









      <section className="bg-muted py-12">


        <div className="mx-auto max-w-6xl px-6 text-center">


          <section
  id="enquiry"
  className="bg-muted py-12"
>


  <div className="mx-auto max-w-6xl px-6 text-center">


    <h2 className="text-3xl font-semibold">
      Interested in this property?
    </h2>



    <p className="mt-3 text-muted-foreground">
      Connect with us for a private viewing and more details.
    </p>





    <a

      href={whatsappUrl}

      target="_blank"

      className="
        mt-6
        inline-block
        rounded-xl
        bg-primary
        px-8
        py-3
        text-white
      "

    >

      Connect with us


    </a>


  </div>


</section>


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
