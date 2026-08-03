"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  Button,
} from "@/components/ui/button"

import {
  archiveProperty,
} from "@/lib/repositories/property-repository"


export function ArchivePropertyButton({
  propertyId,
}:{
  propertyId:string
}) {


  const router =
    useRouter()


  const [
    loading,
    setLoading,
  ] =
  useState(false)



  async function handleArchive(){

    const confirmed =
      window.confirm(
        "Archive this property?"
      )


    if(!confirmed){

      return

    }


    setLoading(true)


    try{

      await archiveProperty(
        propertyId
      )

      router.refresh()


    }
    catch(error){

      console.error(
        "Failed archiving property",
        error
      )

      alert(
        "Could not archive property"
      )

    }
    finally{

      setLoading(false)

    }

  }



  return (

    <Button

      variant="outline"

      disabled={loading}

      onClick={handleArchive}

    >

      {
        loading
          ? "Archiving..."
          : "Archive Property"
      }

    </Button>

  )

}