"use client"

import {
  useState,
} from "react"

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

}:Props){


  const [
    open,
    setOpen,
  ] = useState(false)




  return (

    <>

      <Button

        onClick={() =>
          setOpen(true)
        }

        className="rounded-md"

      >

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