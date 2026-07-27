"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import type {
  PropertyDocument,
} from "@/types/property-document"

import {
  PropertyDocumentUpload,
} from "@/components/properties/property-document-upload"

import {
  deletePropertyDocument,
} from "@/lib/repositories/property-document-repository"

import {
  Button,
} from "@/components/ui/button"



type Props = {
  documents: PropertyDocument[]

  propertyId:string
}





export function PropertyDocuments({
  documents,
  propertyId,
}: Props) {


  const router =
    useRouter()



  const [
    deleting,
    setDeleting,
  ] =
  useState<string | null>(null)







  async function removeDocument(
    document: PropertyDocument
  ){


    const confirmed =
      window.confirm(
        "Delete this document?"
      )


    if(!confirmed){

      return

    }





    try {


      setDeleting(
        document.id
      )



      await deletePropertyDocument(
        document.id,
        document.fileUrl
      )



      router.refresh()


    } catch(error){


      console.error(
        "Document delete failed",
        error
      )


      alert(
        "Failed deleting document"
      )


    } finally {


      setDeleting(null)


    }

  }








  return (

    <section className="
      rounded-2xl
      border
      p-4
      space-y-4
      sm:p-6
    ">


      <div className="
        flex
        flex-col
        gap-3
        sm:flex-row
        sm:items-center
        sm:justify-between
      ">


        <h2 className="text-xl font-semibold">

          Property Documents

        </h2>



        <PropertyDocumentUpload

          propertyId={
            propertyId
          }

        />


      </div>







      {
        documents.length > 0 ? (

          <div className="space-y-3">


            {
              documents.map(

                document => (

                  <div

                    key={
                      document.id
                    }

                    className="
                      flex
                      flex-col
                      gap-4
                      rounded-xl
                      border
                      p-4
                      sm:flex-row
                      sm:items-center
                      sm:justify-between
                    "

                  >



                    <div className="min-w-0">


                      <p className="
                        truncate
                        font-medium
                      ">

                        {document.name}

                      </p>



                      <p className="
                        mt-1
                        text-sm
                        capitalize
                        text-muted-foreground
                      ">

                        {document.category}

                      </p>


                    </div>







                    <div className="
  flex
  w-full
  gap-3
  sm:w-auto
  sm:shrink-0
">



                      <a

                        href={
                          document.fileUrl
                        }

                        target="_blank"

                        rel="noopener noreferrer"

                        className="
  flex
  flex-1
  items-center
  justify-center
  rounded-md
  border
  px-3
  py-2
  text-sm
  text-primary
  sm:flex-none
"

                      >

                        Open

                      </a>







                      <Button

                        variant="outline"

                        size="sm"

                        onClick={() =>
                          removeDocument(
                            document
                          )
                        }

                        disabled={
                          deleting === document.id
                        }

                      >

                        {
                          deleting === document.id
                            ? "Deleting..."
                            : "Delete"
                        }

                      </Button>


                    </div>


                  </div>

                )

              )

            }


          </div>


        ) : (


          <p className="text-muted-foreground">

            No documents uploaded.

          </p>


        )

      }


    </section>

  )

}