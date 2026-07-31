"use client"

import {
  useState,
} from "react"

import {
  Button,
} from "@/components/ui/button"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import type {
  Property,
} from "@/types/property"



type Props = {

  property: Property

  advisorId?: string

}





export function PropertyEnquiryForm({

  property,

  advisorId,

}: Props){



  const [
    name,
    setName,
  ] =
  useState("")



  const [
    phone,
    setPhone,
  ] =
  useState("")



  const [
    email,
    setEmail,
  ] =
  useState("")



  const [
    message,
    setMessage,
  ] =
  useState("")



  const [
    loading,
    setLoading,
  ] =
  useState(false)



  const [
    submitted,
    setSubmitted,
  ] =
  useState(false)







  async function submit(){


    if(
      !name ||
      !phone
    ){

      alert(
        "Please enter your name and phone number"
      )

      return

    }



    setLoading(true)





    try {


      const contact =

        await ContactsRepository.create({

          fullName:
            name,


          phone:
            phone,


          email:
            email || undefined,


          whatsapp:
            phone,


          leadSource:
            advisorId
              ? "property_share"
              : "website",


          advisorId:
  advisorId || undefined,



          propertyType:
            property.propertyType?.toLowerCase(),



          locations:
            [
              property.location
            ],



          notes:

`Interested in property:

${property.name}

${message}`



        })







      await createActivity({

        type:
          "contact_created",


        title:
          "New Property Enquiry",


        description:
          `${name} enquired about ${property.name}`,


        body:

`Property enquiry received from public page.

Property:
${property.name}

Shared by Advisor:
${advisorId ?? "Direct Website"}

Message:
${message}`,



        contactId:
          contact.id,


        propertyId:
          property.id,


        date:
          new Date().toISOString(),

      })






      setSubmitted(true)



    }
    catch(error){


      console.error(
        "Enquiry failed",
        error
      )


      alert(
        "Unable to submit enquiry"
      )


    }
    finally{


      setLoading(false)

    }


  }







  if(submitted){

    return (

      <div className="rounded-3xl border p-8 text-center">


        <h3 className="text-2xl font-semibold">

          Thank you

        </h3>


        <p className="mt-3 text-muted-foreground">

          We will get back to you shortly regarding this property.

        </p>


      </div>

    )

  }







  return (

    <div className="rounded-3xl border p-8 space-y-5">


      <h2 className="text-3xl font-semibold">

        Schedule a Private Viewing

      </h2>



      <input

        className="w-full rounded-xl border p-3"

        placeholder="Your Name"

        value={name}

        onChange={
          e =>
            setName(
              e.target.value
            )
        }

      />





      <input

        className="w-full rounded-xl border p-3"

        placeholder="Phone Number"

        value={phone}

        onChange={
          e =>
            setPhone(
              e.target.value
            )
        }

      />





      <input

        className="w-full rounded-xl border p-3"

        placeholder="Email"

        value={email}

        onChange={
          e =>
            setEmail(
              e.target.value
            )
        }

      />





      <textarea

        className="w-full rounded-xl border p-3"

        placeholder="Message"

        rows={4}

        value={message}

        onChange={
          e =>
            setMessage(
              e.target.value
            )
        }

      />





      <Button

        className="w-full"

        disabled={
          loading
        }

        onClick={
          submit
        }

      >

        {
          loading
            ? "Submitting..."
            : "Request Private Viewing"
        }

      </Button>


    </div>

  )

}