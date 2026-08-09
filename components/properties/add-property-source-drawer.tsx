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

  const [
    error,
    setError,
  ] =
  useState<string | null>(null)







  async function submit(){


    if(!contactId){

      setError("Select a contact before adding a property source.")

      return

    }


    setLoading(true)
    setError(null)



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
    catch(error){

      console.error("Unable to add property source", error)
      setError("Unable to add the property source. Please try again.")

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


        <div className="space-y-2">
          <label htmlFor="property-source-relationship" className="text-sm font-medium">
            Source relationship
          </label>

        <select

          id="property-source-relationship"

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

        </div>





        <div className="space-y-2">
          <label htmlFor="property-source-contact" className="text-sm font-medium">
            Contact <span className="text-destructive">*</span>
          </label>

        <select

          id="property-source-contact"

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

        </div>





        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button

          type="button"

          variant="outline"

          disabled={loading}

          onClick={() => onOpenChange(false)}

        >

          Cancel

        </Button>

        <Button

          className="w-full sm:w-auto"

          onClick={submit}

          disabled={loading || !contactId}

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


      </div>


    </FormDrawer>

  )

}
