"use client"

import {
  useState,
} from "react"

import {
  Share2,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"

import {
  SharePropertyDrawer,
} from "@/components/deals/share-property-drawer"

import type {
  Property,
} from "@/types/property"



type Props = {

  property: Property

}





export function SharePropertyButton({
  property,
}: Props){


  const [
    open,
    setOpen,
  ] = useState(false)





  return (

    <>

      <Button

        variant="outline"

        size="sm"

        onClick={() =>
          setOpen(true)
        }

        className="
          rounded-md
          whitespace-nowrap
        "

      >

        <Share2 className="mr-2 h-4 w-4"/>

        Share Property

      </Button>





      <SharePropertyDrawer

        open={
          open
        }

        onOpenChange={
          setOpen
        }

        propertyId={
          property.id
        }

      />


    </>

  )

}