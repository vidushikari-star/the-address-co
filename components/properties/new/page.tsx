"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  Building2,
} from "lucide-react"

import {
  Input
} from "@/components/ui/input"

import {
  Textarea
} from "@/components/ui/textarea"

import {
  Button
} from "@/components/ui/button"

import {
  createProperty,
} from "@/lib/repositories/property-repository"



const listingTypes = [
  "Primary",
  "Resale",
]


const developmentStages = [
  "under_construction",
  "ready_to_move",
  "resale",
]


const propertyTypes = [
  "Villa",
  "Apartment",
  "Plot",
  "Penthouse",
  "Commercial",
]


const transactionTypes = [
  "Sale",
  "Rental",
]



export default function NewPropertyPage() {


  const router =
    useRouter()



  const [saving,setSaving] =
    useState(false)





  const [form,setForm] =
    useState({

      name:"",

      slug:"",

      developer:"",


      transactionType:
        "Sale",


      propertyType:
        "Villa",


      listingType:
        "Primary",


      developmentStage:
        "ready_to_move",


      status:
        "available",


      location:"",

      locality:"",


      price:"",


      bedrooms:"",

      bathrooms:"",

      carpetArea:"",


      tags:"",


      coverImage:"",


      advisor:"",


      note:"",

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







  async function saveProperty(
    event:React.FormEvent
  ){

    event.preventDefault()


    setSaving(true)



    try{


      const property =

        await createProperty({

          name:
            form.name,


          slug:
            form.slug,


          developer:
            form.developer,



          transactionType:
            form.transactionType,



          listingType:
            form.listingType,



          developmentStage:
            form.developmentStage,



          propertyType:
            form.propertyType,



          status:
            form.status,



          location:
            form.location,



          locality:
            form.locality,



          price:
            Number(
              form.price
            ),



          bedrooms:
            Number(
              form.bedrooms
            ),



          bathrooms:
            Number(
              form.bathrooms
            ),



          carpetArea:
            Number(
              form.carpetArea
            ),



          tags:
            form.tags
              .split(",")
              .map(
                item =>
                  item.trim()
              )
              .filter(Boolean),



          coverImage:
            form.coverImage,



          advisor:
            form.advisor,



          note:
            form.note,

        })





      router.push(
        `/properties/${property.slug}`
      )


    }
    catch(error){


      console.error(
        "Failed creating property",
        error
      )


      alert(
        "Unable to create property"
      )


    }
    finally{


      setSaving(false)


    }

  }








  return (

    <div className="
  mx-auto
  w-full
  max-w-5xl
  space-y-6
  p-4
  sm:p-6
  lg:p-8
">


      <div className="
  flex
  items-start
  gap-3
">


        <div className="rounded-xl bg-primary/10 p-3">

          <Building2 className="h-6 w-6 text-primary" />

        </div>



        <div>

          <h1 className="
  text-2xl
  font-semibold
  sm:text-3xl
">
            New Property
          </h1>


          <p className="text-muted-foreground">
            Add a property to your inventory.
          </p>

        </div>


      </div>






      <form
  onSubmit={saveProperty}
  className="
    space-y-6
    rounded-2xl
    border
    bg-card
    p-4
    sm:p-6
    lg:p-8
  "
>



        <section className="space-y-4">

<h2 className="text-lg font-semibold">
  Basic Information
</h2>


<div className="grid gap-4 md:grid-cols-2">

<Input
  placeholder="Property Name"
  value={form.name}
  onChange={
    e =>
      update(
        "name",
        e.target.value
      )
  }
/>


<Input
  placeholder="Developer"
  value={form.developer}
  onChange={
    e =>
      update(
        "developer",
        e.target.value
      )
  }
/>

</div>


<Input
  placeholder="Slug"
  value={form.slug}
  onChange={
    e =>
      update(
        "slug",
        e.target.value
      )
  }
/>


</section>





        <select
          className="w-full rounded-lg border p-3"
          value={form.transactionType}
          onChange={
            e =>
              update(
                "transactionType",
                e.target.value
              )
          }
        >

          {
            transactionTypes.map(
              item => (

                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>

              )
            )
          }

        </select>





        <select
          className="w-full rounded-lg border p-3"
          value={form.propertyType}
          onChange={
            e =>
              update(
                "propertyType",
                e.target.value
              )
          }
        >

          {
            propertyTypes.map(
              item => (

                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>

              )
            )
          }

        </select>





        <select
          className="w-full rounded-lg border p-3"
          value={form.listingType}
          onChange={
            e =>
              update(
                "listingType",
                e.target.value
              )
          }
        >

          {
            listingTypes.map(
              item => (

                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>

              )
            )
          }

        </select>





        <select
          className="w-full rounded-lg border p-3"
          value={form.developmentStage}
          onChange={
            e =>
              update(
                "developmentStage",
                e.target.value
              )
          }
        >

          {
            developmentStages.map(
              item => (

                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>

              )
            )
          }

        </select>





        <div className="grid gap-4 md:grid-cols-2">


          <Input
            placeholder="Location"
            value={form.location}
            onChange={
              e =>
                update(
                  "location",
                  e.target.value
                )
            }
          />



          <Input
            placeholder="Locality"
            value={form.locality}
            onChange={
              e =>
                update(
                  "locality",
                  e.target.value
                )
            }
          />


        </div>






        <Input
 type="number"
 inputMode="numeric"
 placeholder="Asking Price"
          value={form.price}
          onChange={
            e =>
              update(
                "price",
                e.target.value
              )
          }
        />






        <div className="grid gap-4 md:grid-cols-3">


          <Input
 type="number"
 inputMode="numeric"
 placeholder="Bedrooms"
            value={form.bedrooms}
            onChange={
              e =>
                update(
                  "bedrooms",
                  e.target.value
                )
            }
          />



          <Input
 type="number"
 inputMode="numeric"
 placeholder="Bathrooms"
            value={form.bathrooms}
            onChange={
              e =>
                update(
                  "bathrooms",
                  e.target.value
                )
            }
          />



          <Input
 type="number"
 inputMode="numeric"
 placeholder="Carpet Area"
            value={form.carpetArea}
            onChange={
              e =>
                update(
                  "carpetArea",
                  e.target.value
                )
            }
          />


        </div>






        <Input
          placeholder="Tags (comma separated)"
          value={form.tags}
          onChange={
            e =>
              update(
                "tags",
                e.target.value
              )
          }
        />





        <Input
          placeholder="Cover Image URL"
          value={form.coverImage}
          onChange={
            e =>
              update(
                "coverImage",
                e.target.value
              )
          }
        />





        <Input
          placeholder="Advisor"
          value={form.advisor}
          onChange={
            e =>
              update(
                "advisor",
                e.target.value
              )
          }
        />





        <Textarea
          placeholder="Notes"
          value={form.note}
          onChange={
            e =>
              update(
                "note",
                e.target.value
              )
          }
        />





        <Button
          disabled={saving}
        >

          {
            saving
              ? "Saving..."
              : "Create Property"
          }

        </Button>



      </form>


    </div>

  )

}