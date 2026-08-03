"use client"

import Image from "next/image"
import { useState } from "react"

import {
  Camera,
  Star,
  Video,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  PropertyImage,
  deletePropertyImage,
  setCoverImage,
} from "@/lib/repositories/property-image-repository"

import { useRouter } from "next/navigation"

import {
  PropertyImageUpload,
} from "@/components/properties/property-image-upload"


type Props = {
  propertyId: string
  images: PropertyImage[]
}


export function PropertyGallery({
  propertyId,
  images,
}: Props) {


  const router =
    useRouter()



  const [
    loadingImageId,
    setLoadingImageId,
  ] = useState<string | null>(null)





  async function makeCover(
    id: string
  ) {

    setLoadingImageId(id)


    try {

      await setCoverImage(
        id,
        propertyId
      )


      router.refresh()


    } catch (error) {


      console.error(
        "Failed setting cover image",
        error
      )


    } finally {


      setLoadingImageId(null)


    }

  }







  async function removeImage(
    id: string,
    url: string
  ) {


    const confirmed =
      window.confirm(
        "Delete this property media?"
      )


    if(!confirmed){

      return

    }



    setLoadingImageId(id)



    try {


      await deletePropertyImage(
        id,
        url
      )


      router.refresh()



    }
    catch(error){


      console.error(
        "Failed deleting media",
        error
      )


    }
    finally {


      setLoadingImageId(null)


    }


  }







  if(images.length === 0){

    return (

      <div
        className="
          flex
          flex-col
          items-center
          justify-center
          rounded-3xl
          border-2
          border-dashed
          p-12
          text-center
        "
      >

        <div
          className="
            mb-5
            rounded-full
            bg-muted
            p-5
          "
        >

          <Camera className="h-8 w-8 text-muted-foreground" />

        </div>


        <h3 className="text-lg font-semibold">

          No media uploaded

        </h3>


        <p className="
          mt-2
          max-w-sm
          text-sm
          text-muted-foreground
        ">

          Upload property photos or videos
          to showcase this listing.

        </p>


      </div>

    )

  }







  return (

    <div className="space-y-5">



      <div className="flex items-center justify-between">


        <div>

          <h3 className="font-semibold">
            Gallery
          </h3>


          <p className="
            text-sm
            text-muted-foreground
          ">

            {images.length} item{images.length !== 1 ? "s" : ""}

          </p>


        </div>





        <PropertyImageUpload

          propertyId={
            propertyId
          }

        />


      </div>







      <div
        className="
          grid
          grid-cols-1
          gap-5
          sm:grid-cols-2
          xl:grid-cols-4
        "
      >


        {
          images.map(
            image => (

              <div

                key={image.id}

                className="
                  overflow-hidden
                  rounded-3xl
                  border
                  bg-card
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:shadow-lg
                "

              >



                <div
                  className="
                    group
                    relative
                    aspect-[4/3]
                    overflow-hidden
                    bg-muted
                  "
                >



                  {
  image.mediaType === "video" ? (

    <div
  className="
    flex
    h-full
    w-full
    items-center
    justify-center
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

    <Image
      src={image.url}
      alt="Property image"
      fill
      sizes="
        (max-width:768px) 100vw,
        (max-width:1280px) 50vw,
        25vw
      "
      className="
        object-cover
        transition-transform
        duration-300
        group-hover:scale-105
      "
    />

  )
}





                  {
                    image.isCover && (

                      <div
                        className="
                          absolute
                          left-3
                          top-3
                          flex
                          items-center
                          gap-1
                          rounded-full
                          bg-primary
                          px-3
                          py-1
                          text-xs
                          font-medium
                          text-primary-foreground
                        "
                      >

                        <Star className="h-3 w-3 fill-current" />

                        Cover

                      </div>

                    )
                  }




                  {
                    loadingImageId === image.id && (

                      <div
                        className="
                          absolute
                          inset-0
                          flex
                          items-center
                          justify-center
                          bg-black/40
                          backdrop-blur-sm
                        "
                      >

                        <span className="
                          text-sm
                          font-medium
                          text-white
                        ">

                          Working...

                        </span>


                      </div>

                    )
                  }


                </div>








                <div
                  className="
                    flex
                    flex-col
                    gap-3
                    p-4
                  "
                >


                  {
  image.isCover

  ?

  <div
    className="
      flex
      items-center
      gap-2
      text-sm
      font-medium
      text-primary
    "
  >

    <Star className="h-4 w-4 fill-current" />

    Cover Media

  </div>


  :

  <Button

    size="sm"

    variant="outline"

    disabled={
      loadingImageId === image.id
    }

    onClick={() =>
      makeCover(
        image.id
      )
    }

    className="w-full"

  >

    Set as Cover

  </Button>

}







                  <Button

                    size="sm"

                    variant="destructive"

                    disabled={
                      loadingImageId === image.id
                    }

                    onClick={() => {


                      if(image.isCover){

                        const confirmed =
                          window.confirm(
                            "This is the cover image. Delete it anyway?"
                          )


                        if(!confirmed){

                          return

                        }

                      }


                      removeImage(
                        image.id,
                        image.url
                      )

                    }}

                    className="w-full"

                  >

                    Delete Media

                  </Button>


                </div>


              </div>

            )

          )

        }


      </div>


    </div>

  )

}