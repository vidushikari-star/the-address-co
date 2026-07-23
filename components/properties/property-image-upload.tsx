"use client"

import {
  useRef,
  useState,
} from "react"

import {
  uploadPropertyImage,
} from "@/lib/repositories/property-image-repository"

import {
  Button,
} from "@/components/ui/button"

import {
  useRouter,
} from "next/navigation"





type Props = {

  propertyId:string

}





export function PropertyImageUpload({
  propertyId,
}:Props){


  const router =
    useRouter()


  const fileRef =
    useRef<HTMLInputElement>(null)



  const [
    file,
    setFile,
  ] =
  useState<File | null>(null)



  const [
    loading,
    setLoading,
  ] =
  useState(false)





  async function upload(){


    if(!file){

      alert(
        "Please choose an image first"
      )

      return

    }



    setLoading(true)


    try {


      await uploadPropertyImage(
        propertyId,
        file
      )


      setFile(null)


      if(fileRef.current){

        fileRef.current.value = ""

      }


      router.refresh()


    } catch(error){


      console.error(
        "Image upload failed",
        error
      )


      alert(
        "Image upload failed"
      )


    } finally {


      setLoading(false)

    }

  }






  return (

    <div className="flex items-center gap-3">


      <input

        ref={fileRef}

        type="file"

        accept="image/*"

        hidden

        onChange={
          e =>
            setFile(
              e.target.files?.[0] ?? null
            )
        }

      />





      <Button

        type="button"

        variant="outline"

        onClick={() =>
          fileRef.current?.click()
        }

      >

        Choose Image

      </Button>





      {
        file && (

          <span className="text-sm text-muted-foreground">

            {file.name}

          </span>

        )
      }





      <Button

        type="button"

        onClick={upload}

        disabled={
          loading ||
          !file
        }

      >

        {
          loading
          ? "Uploading..."
          : "Upload"
        }

      </Button>


    </div>

  )

}