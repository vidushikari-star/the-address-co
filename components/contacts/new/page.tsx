"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  UserPlus,
} from "lucide-react"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
  ContactFormFields,
} from "@/components/contacts/contact-form-fields"









export default function NewRelationshipPage() {


  const router =
    useRouter()



  const [
    loading,
    setLoading,
  ] =
  useState(false)





  const [
    form,
    setForm,
  ] =
  useState({

    fullName:"",

    phone:"",

    email:"",

    whatsapp:"",

    city:"",

    country:"",


    relationshipTypes:
      [] as string[],



    leadSource:"referral",

    intent:
  "" as "sale" | "rental" | "both" | "",


    budgetMin:"",

    budgetMax:"",


    propertyType:"villa",


    bedrooms:"",

    bathrooms:"",


    resident:"",


    minArea:"",

    maxArea:"",

    plotSize:"",


    purpose:"",

    financing:"",


    timeline:"",


    locations:"",


    mustHave:"",

    niceToHave:"",


    spouseName:"",

    coBuyer:"",

    referralSource:"",


    notes:"",


  })








  function update(
    key:string,
    value:string
  ){

    setForm(
      current => ({

        ...current,

        [key]:
          value,

      })
    )

  }








  function toggleRelationship(
    type:string
  ){

    setForm(
      current => ({

        ...current,

        relationshipTypes:

          current.relationshipTypes.includes(type)

            ? current.relationshipTypes.filter(
                item => item !== type
              )

            :

              [
                ...current.relationshipTypes,
                type,
              ]

      })
    )

  }









  async function handleSubmit(
    event:React.FormEvent
  ){

    event.preventDefault()


    setLoading(true)



    try {


      const contact =

        await ContactsRepository.create({

          fullName:
            form.fullName,


          phone:
            form.phone,


          email:
            form.email,


          whatsapp:
            form.whatsapp,


          city:
            form.city,


          country:
            form.country,



          relationshipTypes:
            form.relationshipTypes,



          leadSource:
            form.leadSource,


          intent:
  form.intent === "sale"
  ||
  form.intent === "rental"
  ||
  form.intent === "both"
    ? form.intent
    : undefined,



          budgetMin:
            form.budgetMin
              ? Number(form.budgetMin)
              : undefined,



          budgetMax:
            form.budgetMax
              ? Number(form.budgetMax)
              : undefined,



          propertyType:
            form.propertyType || undefined,



          bedrooms:
            form.bedrooms || undefined,



          bathrooms:
            form.bathrooms
              ? Number(form.bathrooms)
              : undefined,



          resident:
            form.resident || undefined,



          minArea:
            form.minArea
              ? Number(form.minArea)
              : undefined,



          maxArea:
            form.maxArea
              ? Number(form.maxArea)
              : undefined,



          plotSize:
            form.plotSize
              ? Number(form.plotSize)
              : undefined,



          purpose:
            form.purpose || undefined,



          financing:
            form.financing || undefined,



          timeline:
            form.timeline || undefined,



          locations:
            form.locations
              .split(",")
              .map(
                item =>
                  item.trim()
              )
              .filter(Boolean),



          mustHave:
            form.mustHave
              .split(",")
              .map(
                item =>
                  item.trim()
              )
              .filter(Boolean),



          niceToHave:
            form.niceToHave
              .split(",")
              .map(
                item =>
                  item.trim()
              )
              .filter(Boolean),



          spouseName:
            form.spouseName || undefined,



          coBuyer:
            form.coBuyer || undefined,



          referralSource:
            form.referralSource || undefined,



          notes:
            form.notes,


        })



      router.push(
        `/contacts/${contact.id}`
      )


    }
    catch(error){


      console.error(
        "Failed creating relationship",
        error
      )


      alert(
        "Unable to create relationship"
      )


    }
    finally{


      setLoading(false)


    }

  }









  return (

    <div className="
      mx-auto
      max-w-4xl
      space-y-8
      p-8
    ">



      <div className="
        flex
        items-center
        gap-3
      ">


        <div className="
          rounded-xl
          bg-primary/10
          p-3
        ">

          <UserPlus className="
            h-6
            w-6
            text-primary
          " />

        </div>



        <div>

          <h1 className="
            text-3xl
            font-bold
          ">

            New Relationship

          </h1>



          <p className="
            text-muted-foreground
          ">

            Add a buyer, seller, investor or business contact.

          </p>


        </div>


      </div>








      <form

        onSubmit={handleSubmit}

        className="
          rounded-2xl
          border
          bg-card
          p-8
          space-y-6
        "

      >


        <ContactFormFields

          form={form}

          update={update}

          toggleRelationship={
            toggleRelationship
          }

        />



        <button

          disabled={
            loading
          }

          className="
            rounded-xl
            bg-primary
            px-6
            py-3
            text-primary-foreground
          "

        >

          {
            loading
              ? "Saving..."
              : "Create Relationship"
          }


        </button>


      </form>


    </div>

  )

}