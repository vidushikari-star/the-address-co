"use client"

import {
  useState,
} from "react"

import {
  addPropertyContact,
} from "@/lib/repositories/property-contact-repository"

import {
  Button,
} from "@/components/ui/button"

import {
  FormDrawer,
} from "@/components/forms/form-drawer"

import type {
  PropertyContactRelationship,
} from "@/types/property"

import {
  addContactRelationshipType,
} from "@/lib/supabase/repositories/contact-relationship.repository"




type Props = {

  open:boolean

  onOpenChange:(open:boolean)=>void

  propertyId:string

  contacts:{
  id:string
  firstName?:string
  lastName?:string | null
}[]

  onAdded:()=>void

}





export function AddPropertySourceDrawer({

  open,

  onOpenChange,

  propertyId,

  contacts,

  onAdded,

}:Props){



  const [
    contactId,
    setContactId,
  ] =
  useState("")



  const [
    relationshipType,
    setRelationshipType,
  ] =
  useState<PropertyContactRelationship>(
    "owner"
  )



  const [
    loading,
    setLoading,
  ] =
  useState(false)







  async function submit(){


    if(!contactId){

      return

    }


    setLoading(true)



    try {


      await addPropertyContact({

        propertyId,

        contactId,

        relationshipType,

      })

      await addContactRelationshipType(
  contactId,
  relationshipType
)



      onAdded()


      onOpenChange(false)



    }

    finally{

      setLoading(false)

    }


  }

  







  return (

    <FormDrawer

      open={open}

      onOpenChange={onOpenChange}

      title="Add Property Source"

      description="Add owner, developer, MOU holder or broker."

    >


      <div className="space-y-4">


        <select

          className="w-full rounded-lg border p-3"

          value={relationshipType}

          onChange={
            e =>
              setRelationshipType(
                e.target.value as PropertyContactRelationship
              )
          }

        >

          <option value="owner">
            Owner
          </option>


          <option value="developer">
            Developer
          </option>


          <option value="mou_holder">
            MOU Holder
          </option>


          <option value="broker">
            Broker
          </option>


        </select>





        <select

          className="w-full rounded-lg border p-3"

          value={contactId}

          onChange={
            e =>
              setContactId(
                e.target.value
              )
          }

        >

          <option value="">
            Select Contact
          </option>


          {
  contacts.map(

    contact => (

      <option

        key={
          contact.id
        }

        value={
          contact.id
        }

      >

        {
  [
    contact.firstName,
    contact.lastName
  ]
  .filter(Boolean)
  .join(" ")
  ||
  "Unnamed Contact"
}

      </option>

    )

  )
}


        </select>





        <Button

          className="w-full"

          onClick={submit}

          disabled={loading}

        >

          {
            loading
            ?
            "Saving..."
            :
            "Add Source"
          }

        </Button>


      </div>


    </FormDrawer>

  )

}