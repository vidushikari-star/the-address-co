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
    document:PropertyDocument
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


    }
    catch(error){


      console.error(
        "Document delete failed",
        error
      )


      alert(
        "Failed deleting document"
      )


    }
    finally{


      setDeleting(null)


    }


  }





  return (

    <section className="rounded-2xl border p-6 space-y-5">


      <div className="flex items-center justify-between">


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

                    className="flex items-center justify-between rounded-xl border p-4"

                  >


                    <div>


                      <p className="font-medium">
                        {document.name}
                      </p>



                      <p className="text-sm text-muted-foreground capitalize">
                        {document.category}
                      </p>


                    </div>





                    <div className="flex items-center gap-3">


                      <a

                        href={
                          document.fileUrl
                        }

                        target="_blank"

                        rel="noopener noreferrer"

                        className="text-sm text-primary underline"

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