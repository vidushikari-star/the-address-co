"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  useRouter,
  useParams,
} from "next/navigation"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
  createNote,
} from "@/lib/repositories/note-repository"

import {
  Button,
} from "@/components/ui/button"

import {
  ContactFormFields,
} from "@/components/contacts/contact-form-fields"





export default function EditContactPage() {


  const router =
    useRouter()


  const params =
    useParams()


  const id =
    params.id as string





  const [
    loading,
    setLoading,
  ] =
  useState(true)



  const [
    saving,
    setSaving,
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

    leadSource:
      "referral",

    budgetMin:"",

    budgetMax:"",

    propertyType:
      "villa",

    bedrooms:"",

    purpose:"",

    financing:"",

    timeline:"",

    locations:"",

    mustHave:"",

    notes:"",

  })






  useEffect(()=>{


    async function loadContact(){


      const data =
        await ContactsRepository.getById(
          id
        )



      setForm({

        fullName:
          data.name ?? "",


        phone:
          data.phone ?? "",


        email:
          data.email ?? "",


        whatsapp:
          data.whatsapp ?? "",


        city:
          data.city ?? "",


        country:
          data.country ?? "",


        relationshipTypes:
          data.relationshipTypes ?? [],


        leadSource:
          data.leadSource ?? "referral",


        budgetMin:
          data.budgetMin
            ? String(data.budgetMin)
            : "",


        budgetMax:
          data.budgetMax
            ? String(data.budgetMax)
            : "",


        propertyType:
          data.propertyType ?? "villa",


        bedrooms:
          data.bedrooms
            ? String(data.bedrooms)
            : "",


        purpose:
  data.purpose ?? "",


        financing:
          data.financing ?? "",


        timeline:
          data.timeline ?? "",


        locations:
          data.locations?.join(", ") ?? "",


        mustHave:
          data.mustHave?.join(", ") ?? "",


        notes:
  "",

      })



      setLoading(false)

    }


    loadContact()


  },[id])







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

            ?

              current.relationshipTypes.filter(
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








    async function save() {

    setSaving(true)

    try {

      await ContactsRepository.update(
        id,
        {

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

          leadSource:
            form.leadSource,

          budgetMin:
            form.budgetMin
              ? Number(form.budgetMin)
              : undefined,

          budgetMax:
            form.budgetMax
              ? Number(form.budgetMax)
              : undefined,

          propertyType:
            form.propertyType,

          bedrooms:
            form.bedrooms,

          purpose:
  form.purpose || undefined,

          financing:
  form.financing || undefined,

          timeline:
            form.timeline,

          locations:
            form.locations
              .split(",")
              .map(
                item => item.trim()
              )
              .filter(Boolean),

          mustHave:
            form.mustHave
              .split(",")
              .map(
                item => item.trim()
              )
              .filter(Boolean),

        }
      )


      if(
        form.notes.trim()
      ){

        await createNote({

          contactId:id,

          content:
            form.notes.trim(),

        })

      }


      router.push(
        `/contacts/${id}`
      )


    }
    catch(error){

      console.error(
        "Failed updating contact",
        error
      )


      alert(
        "Unable to save contact"
      )

    }
    finally{

      setSaving(false)

    }

  }

if (loading) {

  return (
    <div className="p-8">
      Loading...
    </div>
  )

}







  if(loading){

    return (

      <div className="p-8">

        Loading...

      </div>

    )

  }







  return (

    <div className="mx-auto max-w-4xl space-y-8 p-8">


      <div>


        <h1 className="text-3xl font-bold">

          Edit Contact

        </h1>


        <p className="text-muted-foreground">

          Update buyer information and requirements.

        </p>


      </div>






      <div className="rounded-2xl border bg-card p-8 space-y-5">


        <ContactFormFields

          form={form}

          update={update}

          toggleRelationship={
            toggleRelationship
          }

        />




        <Button

          onClick={save}

          disabled={saving}

        >

          {
            saving
              ? "Saving..."
              : "Save Changes"
          }


        </Button>


      </div>


    </div>

  )

}