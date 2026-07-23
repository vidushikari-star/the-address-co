"use client"

import {
  useState,
} from "react"

import {
  Pencil,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"

import {
  EditDealDrawer,
} from "@/components/forms/edit-deal-drawer"

import type {
  Deal,
} from "@/types/deal"



type Props = {

  deal: Deal

}



export function EditDealActions({
  deal,
}: Props) {


  const [
    open,
    setOpen,
  ] = useState(false)



  return (

    <>

      <Button

        variant="outline"

        onClick={() =>
          setOpen(true)
        }

      >

        <Pencil className="mr-2 h-4 w-4" />

        Edit Deal

      </Button>



      <EditDealDrawer

        open={open}

        onOpenChange={setOpen}

        deal={deal}

      />

    </>

  )

}