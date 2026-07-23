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





  if(
    images.length === 0
  ){

    return (

      <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">

        No property images added yet.

      </div>

    )

  }





  return (

    <div className="grid gap-5 md:grid-cols-3">


      {
        images.map(
          image => (

            <div

              key={
                image.id
              }

              className="rounded-2xl border overflow-hidden"

            >


              <img

                src={
                  image.url
                }

                alt="Property image"

                className="h-56 w-full object-cover"

              />




              <div className="flex items-center justify-between p-3">


                {
                  image.isCover ? (

                    <span className="text-xs font-medium text-primary">

                      Cover Image

                    </span>

                  ) : (

                    <Button

                      size="sm"

                      variant="outline"

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