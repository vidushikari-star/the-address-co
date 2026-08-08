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
  PropertyEnquiryForm,
} from "@/components/public/property-enquiry-form"

import type { ReactNode } from "react"

import {
  formatExactPropertyPrice
} from "@/lib/utils/format-currency"

import {
  supabase,
} from "@/lib/supabase/client"

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

const documents =
  await getPropertyDocuments(
    property.id
  )

  const publicDocuments =
  documents.filter(
    document =>
      [
        "brochure",
        "floor_plan",
        "price_sheet",
        "payment_plan",
      ].includes(
        document.category
      )
  )



  const coverMedia =
  images.find(
    image => image.isCover
  )
  ||
  images[0]
  ||
  null


const coverUrl =
  coverMedia?.url ||
  property.coverImage


const coverType =
  coverMedia?.mediaType ||
  "image"




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
  "The Address Co"





  const advisorWhatsapp =
    (
      sharedAdvisor?.whatsapp ??
      sharedAdvisor?.phone ??
      ""
    )
    .replace(
      /\D/g,
      ""
    )





  const whatsappMessage =

`Hi The Address Co,

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

          <img

            src={coverUrl}

            alt={property.name}

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
        {property.name}
      </h1>


      <p className="mt-4 text-xl text-white/80">
        {property.location}
      </p>

      <LocationMapPreview

location={
property.location
}

/>



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
              displayPrice,
              property.transactionType
            )
          }

        </p>



        {
          property.transactionType === "Rental" &&
          property.price.securityDeposit &&
          property.price.securityDeposit > 0 && (

            <div
              className="
                mt-4
                border-t
                border-white/20
                pt-4
              "
            >

              <p className="text-sm text-white/70">
                Security Deposit
              </p>

              <p className="text-xl font-semibold">

                {
                  formatExactPropertyPrice(
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
        images.length > 0 && (

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
  images.map(
    image => (

      <div
        key={image.id}
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
        className="
          h-full
          w-auto
          object-contain
        "
      />

    </div>

  ) : (

    <img
      src={image.url}
      alt={property.name}
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
  publicDocuments.length > 0 && (

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
          publicDocuments.map(
            document => (

              <a
                key={document.id}
                href={document.fileUrl}
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

          property={property}

          advisorId={advisorId}

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