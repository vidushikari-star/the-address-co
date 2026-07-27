"use client"

import {
  useState,
} from "react"

import {
  PropertyImage,
  deletePropertyImage,
  setCoverImage,
} from "@/lib/repositories/property-image-repository"

import {
  Button,
} from "@/components/ui/button"

import {
  useRouter,
} from "next/navigation"



type Props = {

  propertyId:string

  images:PropertyImage[]

}





export function PropertyGallery({
  propertyId,
  images,
}:Props){


  const router =
    useRouter()



  const [
    loading,
    setLoading,
  ] =
  useState(false)







  async function makeCover(
    id:string
  ){

    setLoading(true)


    try {

      await setCoverImage(
        id,
        propertyId
      )


      router.refresh()


    } catch(error){

      console.error(
        "Failed setting cover image",
        error
      )


    } finally {

      setLoading(false)

    }

  }







  async function removeImage(
    id:string,
    url:string
  ){

    setLoading(true)


    try {

      await deletePropertyImage(
        id,
        url
      )


      router.refresh()


    } catch(error){

      console.error(
        "Failed deleting image",
        error
      )


    } finally {

      setLoading(false)

    }

  }








  if(images.length === 0){

    return (

      <div className="
        rounded-2xl
        border
        border-dashed
        p-8
        text-center
        text-muted-foreground
      ">

        No property images added yet.

      </div>

    )

  }








  return (

    <div className="
      grid
      gap-4
      sm:grid-cols-2
      lg:grid-cols-3
    ">


      {
        images.map(

          image => (

            <div

              key={
                image.id
              }

              className="
                overflow-hidden
                rounded-2xl
                border
                bg-card
              "

            >



              <div
  className="
    group
    aspect-[4/3]
    overflow-hidden
    bg-muted
  "
>


                <img

                  src={
                    image.url
                  }

                  alt="Property image"

                  className="
                    h-full
                    w-full
                    object-cover
                    transition-transform
                    duration-300
                    group-hover:scale-105
                  "

                />


              </div>







              <div className="
                flex
                flex-col
                gap-3
                p-3
                sm:flex-row
                sm:items-center
                sm:justify-between
              ">


                {
                  image.isCover ? (

                    <span className="
                      text-xs
                      font-medium
                      text-primary
                    ">

                      Cover Image

                    </span>

                  ) : (

                    <Button

                      size="sm"

                      variant="outline"

                      className="w-full sm:w-auto"

                      disabled={loading}

                      onClick={() =>
                        makeCover(
                          image.id
                        )
                      }

                    >

                      Set Cover

                    </Button>

                  )

                }







                <Button

                  size="sm"

                  variant="destructive"

                  className="w-full sm:w-auto"

                  disabled={loading}

                  onClick={() =>
                    removeImage(
                      image.id,
                      image.url
                    )
                  }

                >

                  Delete

                </Button>


              </div>


            </div>

          )

        )

      }


    </div>

  )

}