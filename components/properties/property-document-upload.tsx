"use client"

import {
  useRef,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  Button,
} from "@/components/ui/button"

import {
  uploadPropertyDocument,
} from "@/lib/repositories/property-document-repository"





type Props = {

  propertyId:string

}





export function PropertyDocumentUpload({
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
    category,
    setCategory,
  ] =
  useState("brochure")



  const [
    loading,
    setLoading,
  ] =
  useState(false)





  async function upload(){


    if(!file){

      alert(
        "Please choose a document"
      )

      return

    }



    if(
      file.size > 20 * 1024 * 1024
    ){

      alert(
        "File size should be less than 20MB"
      )

      return

    }



    setLoading(true)


    try {


      await uploadPropertyDocument(
        propertyId,
        file,
        category
      )


      setFile(null)



      if(fileRef.current){

        fileRef.current.value = ""

      }


      router.refresh()


    }
    catch(error){


      console.error(
        "Document upload failed",
        error
      )


      alert(
        "Document upload failed"
      )


    }
    finally{


      setLoading(false)


    }

  }





  return (

    <div className="
      flex
      flex-wrap
      items-center
      gap-3
    ">


      <select

        className="
          rounded-md
          border
          px-3
          py-2
          text-sm
        "

        value={category}

        onChange={
          e =>
            setCategory(
              e.target.value
            )
        }

      >

        <option value="brochure">
          Brochure
        </option>

        <option value="floor_plan">
          Floor Plan
        </option>

        <option value="price_sheet">
          Price Sheet
        </option>

        <option value="payment_plan">
          Payment Plan
        </option>

        <option value="legal">
          Legal Documents
        </option>

        <option value="approvals">
          Approvals
        </option>

        <option value="other">
          Other
        </option>

      </select>





      <input

        ref={fileRef}

        type="file"

        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"

        hidden

        onChange={
          e =>
            setFile(
              e.target.files?.[0] ?? null
            )
        }

      />





      <Button

        variant="outline"

        onClick={() =>
          fileRef.current?.click()
        }

      >

        Upload Brochure / Document

      </Button>





      {
        file && (

          <span
            className="
              max-w-[250px]
              truncate
              text-sm
              text-muted-foreground
            "
          >

            {file.name}

          </span>

        )
      }





      <Button

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