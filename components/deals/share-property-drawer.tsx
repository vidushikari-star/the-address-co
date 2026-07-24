"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  FormDrawer,
} from "@/components/forms/form-drawer"

import {
  Button,
} from "@/components/ui/button"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
  getPropertyById,
} from "@/lib/repositories/property-repository"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import {
  getCurrentUser,
} from "@/lib/auth/current-user"

import type {
  Contact,
} from "@/types/contact"

import type {
  Property,
} from "@/types/property"

import type {
  UserProfile,
} from "@/types/user"





type Props = {

  open:boolean

  onOpenChange:(open:boolean)=>void

  propertyId:string

}





export function SharePropertyDrawer({

  open,

  onOpenChange,

  propertyId,

}:Props){



  const [
    property,
    setProperty,
  ] =
  useState<Property | null>(null)



  const [
    contacts,
    setContacts,
  ] =
  useState<Contact[]>([])



  const [
    currentUser,
    setCurrentUser,
  ] =
  useState<UserProfile | null>(null)



  const [
    selectedContact,
    setSelectedContact,
  ] =
  useState("")



  const [
    loading,
    setLoading,
  ] =
  useState(false)







  useEffect(()=>{


    async function load(){


      const [

        propertyData,

        contactData,

        userData,

      ] =
      await Promise.all([


        getPropertyById(
          propertyId
        ),


        ContactsRepository.getAll(),


        getCurrentUser(),


      ])



      setProperty(
        propertyData ?? null
      )


      setContacts(
        contactData
      )


      setCurrentUser(
        userData
      )


    }



    if(open){

      load()

    }


  },[
    open,
    propertyId,
  ])









  async function share(){


    if(
      !property ||
      !selectedContact
    ){

      return

    }





    const buyer =
      contacts.find(
        contact =>
          contact.id === selectedContact
      )



    if(!buyer){

      return

    }





    setLoading(true)





    try {




      const propertyUrl =
        `${window.location.origin}/share/${property.slug}`






      const message =


`Hi ${buyer.name},

Sharing details of this luxury property:

\u{1F3E1} ${property.name}


\u{1F4CD} Location:
${property.location || "-"}


\u{1F4B0} Asking Price:
${
  property.price.asking
    ? `₹${property.price.asking.toLocaleString("en-IN")}`
    : "-"
}



Property Details:

• Property Type:
${property.propertyType || "-"}

• Bedrooms:
${property.specifications.bedrooms || "-"}

• Bathrooms:
${property.specifications.bathrooms || "-"}

• Plot Area:
${
  property.specifications.plotArea
    ? `${property.specifications.plotArea} sqm`
    : "-"
}

• Built-up Area:
${
  property.specifications.builtUpArea
    ? `${property.specifications.builtUpArea} sqft`
    : "-"
}

• Furnishing:
${property.furnishing || "-"}



\u{2728} Amenities:

${
  property.amenities?.length
    ? property.amenities
        .map(
          item => `• ${item}`
        )
        .join("\n")
    : "-"
}



About the Property:

${property.description || "-"}



View complete property details and images:

${propertyUrl}



Please let me know if you would like to schedule a private viewing.


Regards,

${currentUser?.name || "The Address Co."}
`






      const phone =

        (
          buyer.whatsapp ??
          buyer.phone
        )
        .replace(
          /\D/g,
          ""
        )







      await createActivity({

        type:
          "property_shared",


        title:
          "Property Shared on WhatsApp",


        description:
          `${property.name} shared with ${buyer.name}`,


        body:
          message,


        contactId:
          buyer.id,


        propertyId:
          property.id,


        date:
          new Date().toISOString(),

      })







      window.open(

        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,

        "_blank"

      )






      onOpenChange(false)





    }
    catch(error){


      console.error(
        "Sharing failed",
        error
      )


      alert(
        "Unable to share property"
      )


    }
    finally{


      setLoading(false)


    }


  }








  return (

    <FormDrawer

      open={
        open
      }

      onOpenChange={
        onOpenChange
      }

      title="Share Property"

      description="Send luxury property details to a buyer."

    >


      <div className="space-y-5">


        <select

          className="w-full rounded-lg border p-3"

          value={
            selectedContact
          }

          onChange={
            e =>
              setSelectedContact(
                e.target.value
              )
          }

        >

          <option value="">
            Select Buyer
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

                  {contact.name}
                  {" - "}
                  {contact.phone}

                </option>

              )

            )

          }


        </select>





        <Button

          className="w-full"

          disabled={
            loading ||
            !selectedContact
          }

          onClick={
            share
          }

        >

          {
            loading
              ? "Opening WhatsApp..."
              : "Share on WhatsApp"
          }


        </Button>


      </div>


    </FormDrawer>

  )

}