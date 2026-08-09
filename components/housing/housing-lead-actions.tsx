"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  Button,
} from "@/components/ui/button"

import {
  getProperties,
} from "@/lib/repositories/property-repository"

import {
  createDeal,
  getDealsByContactId,
} from "@/lib/repositories/deal-repository"

import type {
  Property,
} from "@/types/property"

import {
  Link2,
  Plus,
} from "lucide-react"

import {
  PropertyDrawer,
} from "@/components/forms/property-drawer"

import {
  useRouter,
} from "next/navigation"





type Props = {

  contactId:string

  dealId?:string

  propertyMatched:boolean

  housingLead?: {

    projectName?: string

    locality?: string

    propertyType?: string

    housingId?: string

  }

}





export function HousingLeadActions({
  contactId,
  dealId,
  propertyMatched,
  housingLead,
}:Props){

   const router =
    useRouter()


  const [
    open,
    setOpen,
  ] =
  useState(false)



  const [
    createOpen,
    setCreateOpen,
  ] =
  useState(false)



  const [
    properties,
    setProperties,
  ] =
  useState<Property[]>([])



  const [
    selected,
    setSelected,
  ] =
  useState("")



  const [
    saving,
    setSaving,
  ] =
  useState(false)





  async function loadProperties(){

    const data =
      await getProperties()

    setProperties(data)

  }





  useEffect(()=>{

    if(open){

      loadProperties()

    }

  },[open])







  async function matchProperty(){


    if(!selected){

      return

    }


    setSaving(true)


    try{


      const property =
        properties.find(
          item =>
            item.id === selected
        )

        const existingDeals =
  await getDealsByContactId(
    contactId
  )


const duplicateDeal =
  existingDeals.find(
    deal =>
      deal.propertyId === selected
  )


if(duplicateDeal){

  alert(
    "A deal already exists for this property."
  )

  return

}



      


      await createDeal({

          name:
            `${housingLead?.projectName ?? "Housing Lead"} - ${
              property?.name ?? "Property"
            }`,



          contactId,



          propertyId:
            selected,



          stage:
            "lead",



          value: {

  propertyPrice:
    property?.price?.asking
    ??
    0,


  commissionType:
    "sale",


  commissionBasis:
    "percentage",


  commissionPercentage:
    0,


  commissionAmount:
    0,

},



          notes:[

            "Source: Housing.com",

            `Housing Lead ID: ${
              housingLead?.housingId ?? ""
            }`,

            `Property matched: ${
              property?.name ?? ""
            }`,

          ],

        })





      



      window.location.reload()


    }
    finally{

      setSaving(false)

    }


  }







  if(propertyMatched){

  return (

    <Button

      size="sm"

      variant="outline"

      onClick={() => {

        if(dealId){

          router.push(
            `/deals/${dealId}`
          )

        }

      }}

    >

      <Link2 className="mr-2 h-4 w-4"/>

      View Deal

    </Button>

  )

}







  return (

    <div className="space-y-3">


      <Button

        size="sm"

        variant="outline"

        onClick={
          ()=>setOpen(!open)
        }

      >

        <Link2 className="mr-2 h-4 w-4"/>

        Match Property

      </Button>







      {
        open && (

          <div
            className="
              flex
              gap-2
            "
          >


            <select

              className="
                rounded-md
                border
                px-3
                py-2
                text-sm
              "

              value={selected}

              onChange={
                e =>
                  setSelected(
                    e.target.value
                  )
              }

            >

              <option value="">
                Select property
              </option>



              {
                properties.map(
                  property => (

                    <option
                      key={property.id}
                      value={property.id}
                    >

                      {property.name}

                    </option>

                  )
                )
              }


            </select>





            <Button

              size="sm"

              onClick={
                matchProperty
              }

              disabled={
                saving ||
                !selected
              }

            >

              {
                saving
                ? "Saving..."
                : "Create Deal"
              }

            </Button>


          </div>

        )

      }







      <Button

        size="sm"

        onClick={
          ()=>setCreateOpen(true)
        }

      >

        <Plus className="mr-2 h-4 w-4"/>

        Create Property

      </Button>





      <PropertyDrawer

        open={
          createOpen
        }

        onOpenChange={
          setCreateOpen
        }

        housingLead={
          housingLead
        }

      />


    </div>

  )

}
