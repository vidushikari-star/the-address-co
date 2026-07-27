"use client"

import type {
  PropertyDocument,
} from "@/types/property-document"



type Props = {
  documents: PropertyDocument[]
}



export function PropertyDocuments({
  documents,
}: Props) {


  return (

    <section className="rounded-2xl border p-6 space-y-5">


      <div className="flex items-center justify-between">

        <h2 className="text-xl font-semibold">
          Documents
        </h2>

      </div>





      {
        documents.length > 0 ? (

          <div className="space-y-3">


            {
              documents.map(
                document => (

                  <div
                    key={document.id}
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




                    <a
                      href={document.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline"
                    >

                      Open

                    </a>


                  </div>

                )

              )

            }


          </div>


        ) : (


          <p className="text-muted-foreground">
            No documents available.
          </p>


        )

      }


    </section>

  )

}