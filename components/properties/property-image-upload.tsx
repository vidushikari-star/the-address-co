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
    files,
    setFiles,
  ] =
  useState<File[]>([])





  const [
    previews,
    setPreviews,
  ] =
  useState<
    {
      url:string
      type:"image" | "video"
    }[]
  >([])





  const [
    loading,
    setLoading,
  ] =
  useState(false)







  function selectFiles(
    selectedFiles: FileList | null
  ){

    if(!selectedFiles){

      return

    }



    const selected =
      Array.from(
        selectedFiles
      )



    setFiles(
      current => [
        ...current,
        ...selected,
      ]
    )



    setPreviews(
      current => [

        ...current,

        ...selected.map(
  file => ({

    url:
      URL.createObjectURL(
        file
      ),

    type:
      file.type.startsWith("video/")
        ? ("video" as const)
        : ("image" as const),

  })
),

      ]
    )

  }







  function removeImage(
    index:number
  ){


    setFiles(
      current =>
        current.filter(
          (_,i) =>
            i !== index
        )
    )


    setPreviews(
      current =>
        current.filter(
          (_,i) =>
            i !== index
        )
    )

  }







  function clearSelection(){


    setFiles([])

    setPreviews([])



    if(fileRef.current){

      fileRef.current.value = ""

    }


  }







  async function upload(){


    if(!files.length){

      alert(
        "Please choose photos or videos first"
      )

      return

    }



    setLoading(true)


    try {


      await Promise.all(

        files.map(

          file =>
            uploadPropertyImage(
              propertyId,
              file
            )

        )

      )



      clearSelection()



      router.refresh()



    }
    catch(error){


      console.error(
        "Media upload failed",
        error
      )


      alert(
        "Media upload failed"
      )


    }
    finally {


      setLoading(false)

    }


  }







  return (

    <div className="
      flex
      flex-col
      gap-4
    ">


      <input

        ref={fileRef}

        type="file"

        accept="image/*,video/*"

        multiple

        hidden

        onChange={
          e =>
            selectFiles(
              e.target.files
            )
        }

      />







      {
        previews.length > 0 && (

          <div className="
            grid
            grid-cols-3
            gap-3
            sm:grid-cols-5
          ">


            {
              previews.map(

                (preview,index)=>(

                  <div

                    key={preview.url}

                    className="
                      relative
                    "

                  >


                    {
                      preview.type === "video"

                      ?

                      <video

                        src={preview.url}

                        className="
                          h-20
                          w-20
                          rounded-xl
                          border
                          object-cover
                        "

                      />

                      :

                      <img

                        src={preview.url}

                        alt={`Preview ${index + 1}`}

                        className="
                          h-20
                          w-20
                          rounded-xl
                          border
                          object-cover
                        "

                      />

                    }




                    <button

                      type="button"

                      onClick={() =>
                        removeImage(index)
                      }

                      className="
                        absolute
                        right-1
                        top-1
                        rounded-full
                        bg-black/70
                        px-2
                        text-xs
                        text-white
                      "

                    >

                      ×

                    </button>


                  </div>

                )

              )

            }


          </div>

        )

      }







      <div className="
        flex
        flex-col
        gap-3
        sm:flex-row
        sm:items-center
      ">



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

          Upload Photos / Videos

        </Button>







        {
          files.length > 0 && (

            <p className="
              text-sm
              text-muted-foreground
            ">

              {files.length} file
              {files.length > 1 ? "s" : ""}
              {" "}selected

            </p>

          )
        }







        {
          files.length > 0 && (

            <Button

              type="button"

              variant="ghost"

              onClick={clearSelection}

            >

              Clear

            </Button>

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
            files.length === 0
          }

        >

          {
            loading
              ? "Uploading..."
              : "Upload Media"
          }

        </Button>


      </div>


    </div>

  )

}