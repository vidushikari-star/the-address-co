import {
  CheckCircle2,
  AlertCircle,
  UploadCloud,
} from "lucide-react"

import type {
  Property,
} from "@/types/property"



type Props = {
  property: Property
}





export function HousingSyncStatus({
  property,
}: Props){


  if(
    property.housingSyncStatus === "synced"
  ){

    return (

      <div className="
        rounded-xl
        border
        bg-green-50
        px-4
        py-3
        text-sm
      ">

        <div className="
          flex
          items-center
          gap-2
          font-medium
        ">

          <CheckCircle2
            className="
              h-4
              w-4
            "
          />

          Synced to Housing

        </div>



        {
          property.housingListingId && (

            <p className="
              mt-1
              text-xs
              text-muted-foreground
            ">

              Listing ID:
              {" "}
              {property.housingListingId}

            </p>

          )
        }


      </div>

    )

  }


  if(
    property.housingSyncStatus === "needs_update"
  ){

    return (

      <div className="
        rounded-xl
        border
        bg-yellow-50
        px-4
        py-3
        text-sm
      ">

        <div className="
          flex
          items-center
          gap-2
          font-medium
        ">

          <UploadCloud
            className="
              h-4
              w-4
            "
          />

          Housing Update Required

        </div>


        <p className="
          mt-1
          text-xs
          text-muted-foreground
        ">

          Property details have changed after the last Housing sync.

        </p>


      </div>

    )

  }


  if(
    property.housingSyncStatus === "failed"
  ){

    return (

      <div className="
        rounded-xl
        border
        bg-red-50
        px-4
        py-3
        text-sm
      ">

        <div className="
          flex
          items-center
          gap-2
          font-medium
        ">

          <AlertCircle
            className="
              h-4
              w-4
            "
          />

          Housing Sync Failed

        </div>



        {
          property.housingSyncError && (

            <p className="
              mt-1
              text-xs
            ">

              {property.housingSyncError}

            </p>

          )
        }


      </div>

    )

  }





  return (

    <div className="
      rounded-xl
      border
      px-4
      py-3
      text-sm
    ">


      <div className="
        flex
        items-center
        gap-2
        font-medium
      ">


        <UploadCloud
          className="
            h-4
            w-4
          "
        />


        Not pushed to Housing


      </div>


    </div>

  )

}