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

import {
  ImagePlus,
} from "lucide-react"





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
    preview,
    setPreview,
  ] =
  useState<string | null>(null)





  const [
    loading,
    setLoading,
  ] =
  useState(false)







  function selectFile(
    selected:File | undefined
  ){

    if(!selected){

      return

    }


    setFile(
      selected
    )


    setPreview(
      URL.createObjectURL(
        selected
      )
    )

  }







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

      setPreview(null)



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

    <div className="
      flex
      flex-col
      gap-3
      sm:flex-row
      sm:items-center
    ">



      <input

        ref={fileRef}

        type="file"

        accept="image/*"

        capture="environment"

        hidden

        onChange={
          e =>
            selectFile(
              e.target.files?.[0]
            )
        }

      />







      {
  preview && (

    <div className="flex items-center gap-3">

      <img

        src={preview}

        alt="Preview"

        className="
          h-16
          w-16
          rounded-xl
          border
          object-cover
        "

      />

    </div>

  )
}







      <Button

        type="button"

        variant="outline"

        className="
          w-full
          sm:w-auto
        "

        onClick={() =>
          fileRef.current?.click()
        }

      >

        <ImagePlus className="mr-2 h-4 w-4"/>

        Choose Image

      </Button>







      {
        file && (

          <p className="
            max-w-full
            truncate
            text-sm
            text-muted-foreground
          ">

            {file.name}

          </p>

        )
      }







      <Button

        type="button"

        className="
          w-full
          sm:w-auto
        "

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