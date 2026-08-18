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
getAllUserProfiles,
} from "@/lib/repositories/user-profile-repository"

import type {
UserProfile,
} from "@/types/user"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
  Button,
} from "@/components/ui/button"

import {
  ContactFormFields,
} from "@/components/contacts/contact-form-fields"

import {
notFound
} from "next/navigation"







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
advisors,
setAdvisors,
] =
useState<UserProfile[]>([])





  const [
    form,
    setForm,
  ] =
  useState({

    advisorId:"",

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

    intent:
  "" as "sale" | "rental" | "both" | "",

    budgetMin:"",

    budgetMax:"",

    propertyType:"",

    bedrooms:"",

    bathrooms:"",

    purpose:"",

    financing:"",

    timeline:"",

    locations:"",

    mustHave:"",

    niceToHave:"",

    resident:"",

    minArea:"",

    maxArea:"",

    plotSize:"",

    spouseName:"",

    coBuyer:"",

    referralSource:"",

    notes:"",

  })








  useEffect(()=>{


    async function loadContact(){


      const data =
        await ContactsRepository.getById(
          id
        )

        if(!data){
  notFound()
}

const advisorProfiles =
await getAllUserProfiles()

setAdvisors(
  advisorProfiles
)



      setForm({

        advisorId:
data.advisor ?? "",

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


        intent:
          data.intent ?? "",


        budgetMin:
          data.budgetMin
            ? String(data.budgetMin)
            : "",


        budgetMax:
          data.budgetMax
            ? String(data.budgetMax)
            : "",


        propertyType:
          data.propertyType ?? "",


        bedrooms:
          data.bedrooms
            ? String(data.bedrooms)
            : "",


        bathrooms:
          data.bathrooms
            ? String(data.bathrooms)
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


        niceToHave:
          data.niceToHave?.join(", ") ?? "",


        resident:
          data.resident ?? "",


        minArea:
          data.minArea
            ? String(data.minArea)
            : "",


        maxArea:
          data.maxArea
            ? String(data.maxArea)
            : "",


        plotSize:
          data.plotSize
            ? String(data.plotSize)
            : "",


        spouseName:
          data.spouseName ?? "",


        coBuyer:
          data.coBuyer ?? "",


        referralSource:
          data.referralSource ?? "",


        notes:
          data.notesText ?? "",

      })


      setLoading(false)

    }


    loadContact()


  },[
    id
  ])








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








  async function save(){


    setSaving(true)


    try{


      await ContactsRepository.update(
  id,
  {

    advisorId:
form.advisorId || undefined,


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


          niceToHave:
            form.niceToHave
              .split(",")
              .map(
                item => item.trim()
              )
              .filter(Boolean),


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


          spouseName:
            form.spouseName || undefined,


          coBuyer:
            form.coBuyer || undefined,


          referralSource:
            form.referralSource || undefined,

          notes:
            form.notes || undefined,


        }
      )




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








  if(loading){

    return (

      <div className="p-8">

        Loading...

      </div>

    )

  }








  return (

    <div className="
      mx-auto
      max-w-4xl
      space-y-8
      p-8
    ">


      <div>

        <h1 className="
          text-3xl
          font-bold
        ">

          Edit Contact

        </h1>


        <p className="
          text-muted-foreground
        ">

          Update contact information and requirements.

        </p>


      </div>






      <div className="
        rounded-2xl
        border
        bg-card
        p-8
        space-y-5
      ">


        <ContactFormFields

          form={
            form
          }

          update={
            update
          }

          toggleRelationship={
            toggleRelationship
          }

        />

        <div className="space-y-2">

<p className="text-sm font-medium">
Advisor
</p>

<select

className="
w-full
rounded-lg
border
p-2
text-sm
"

value={
form.advisorId
}

onChange={
e =>
setForm({
...form,
advisorId:e.target.value
})
}

>

<option value="">
Unassigned
</option>


{
advisors.map(
advisor => (

<option
key={
advisor.id
}
value={
advisor.id
}
>

{
advisor.name
}

</option>

)

)
}

</select>

</div>




        <Button

          onClick={
            save
          }

          disabled={
            saving
          }

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
