"use client"

import {
  Trash2,
} from "lucide-react"

import {
  useRouter,
} from "next/navigation"

import {
  Button,
} from "@/components/ui/button"

import {
  deleteProperty,
} from "@/lib/repositories/property-repository"



type Props = {

  propertyId:string

}





export function DeletePropertyButton({
  propertyId,
}:Props){


  const router =
    useRouter()





  async function handleDelete(){


    const confirmed =
      window.confirm(
        "Are you sure you want to delete this property? This will remove the property permanently."
      )



    if(!confirmed){

      return

    }



    try{


      await deleteProperty(
        propertyId
      )


      router.push(
        "/properties"
      )


      router.refresh()


    }
    catch(error){


      console.error(
        "Delete failed",
        error
      )


      alert(
        "Unable to delete property"
      )


    }


  }





  return (

    <Button

      variant="destructive"

      className="
        h-11
      "

      onClick={handleDelete}

    >

      <Trash2 className="mr-2 h-4 w-4"/>

      Delete Property

    </Button>

  )

}