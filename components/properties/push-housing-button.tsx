"use client"

import {
  useState,
} from "react"

import {
  UploadCloud,
  RefreshCw,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"

import type {
  Property,
} from "@/types/property"

import {
  pushPropertyToHousing,
} from "@/lib/integrations/housing/housing/housing-actions"



type Props = {

  property: Property

}





export function PushHousingButton({
  property,
}: Props){


  const [
    loading,
    setLoading,
  ] =
  useState(false)





  async function syncHousing(){


    try {


      setLoading(true)



      const result =
        await pushPropertyToHousing(
          property
        )



      alert(
        `Housing sync successful.\nListing ID: ${result.housing_listing_id}`
      )



      window.location.reload()


    }
    catch(error){


      console.error(
        "Housing sync failed",
        error
      )


      alert(
        "Housing sync failed"
      )


    }
    finally{


      setLoading(false)


    }

  }





  const isSynced =
    property.housingSyncStatus === "synced"



  const needsUpdate =
    property.housingSyncStatus === "needs_update"



  return (

    <Button

      variant="outline"

      size="sm"

      onClick={syncHousing}

      disabled={loading}

      className="
        rounded-md
        whitespace-nowrap
      "

    >

      {
        isSynced || needsUpdate
        ? (

          <RefreshCw
            className="
              mr-2
              h-4
              w-4
            "
          />

        )
        : (

          <UploadCloud
            className="
              mr-2
              h-4
              w-4
            "
          />

        )

      }



      {
        loading

        ? "Syncing..."

        : isSynced || needsUpdate

          ? "Update Housing Listing"

          : "Push to Housing"
      }


    </Button>

  )

}