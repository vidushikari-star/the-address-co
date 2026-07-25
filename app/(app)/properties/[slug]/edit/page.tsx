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
  getPropertyBySlug,
  updateProperty,
} from "@/lib/repositories/property-repository"

import {
  Input,
} from "@/components/ui/input"

import {
  Textarea,
} from "@/components/ui/textarea"

import {
  Button,
} from "@/components/ui/button"



const transactionTypes = [
  "Sale",
  "Rental",
]


const propertyTypes = [
  "Villa",
  "Apartment",
  "Plot",
  "Penthouse",
  "Commercial",
]



export default function EditPropertyPage(){


  const router =
    useRouter()


  const params =
    useParams()


  const slug =
    params.slug as string



  const [loading,setLoading] =
    useState(true)


  const [saving,setSaving] =
    useState(false)



  const [id,setId] =
    useState("")




  const [form,setForm] =
    useState({

      name:"",

      developer:"",

      transactionType:"Sale",

      propertyType:"Villa",

      location:"",

      locality:"",

      googleMapLink:"",

      price:"",

      bedrooms:"",

      bathrooms:"",

      carpetArea:"",

      plotArea:"",

      builtUpArea:"",

      furnishing:"unfurnished",

      description:"",

      amenities:"",

      status:"available",

      advisor:"",

      tags:"",

      note:"",

    })







  useEffect(()=>{


    async function load(){


      const property =
        await getPropertyBySlug(
          slug
        )



      if(!property)
        return



      setId(
        property.id
      )



      setForm({

        name:
          property.name,


        developer:
          property.developer,


        transactionType:
          property.transactionType ?? "Sale",


        propertyType:
          property.propertyType ?? "Villa",


        location:
          property.location,


        locality:
          property.locality ?? "",


        googleMapLink:
          property.googleMapLink ?? "",


        price:
          String(
            property.price.asking
          ),


        bedrooms:
          String(
            property.specifications.bedrooms
          ),


        bathrooms:
          String(
            property.specifications.bathrooms
          ),


        carpetArea:
          String(
            property.specifications.carpetArea
          ),


        plotArea:
          String(
            property.specifications.plotArea ?? 0
          ),


        builtUpArea:
          String(
            property.specifications.builtUpArea ?? 0
          ),


        furnishing:
          property.furnishing ?? "unfurnished",


        description:
          property.description ?? "",


        amenities:
          property.amenities?.join(", ")
          ?? "",


        status:
          property.status,


        advisor:
          property.advisor,


        tags:
          property.tags?.join(", ")
          ?? "",


        note:
          property.note ?? "",


      })


      setLoading(false)


    }


    load()


  },[slug])







  function update(
    key:string,
    value:string
  ){

    setForm(
      current=>({

        ...current,

        [key]:value

      })
    )

  }








  async function save(){


    setSaving(true)



    await updateProperty(

      id,

      {


        name:
          form.name,


        developer:
          form.developer,


        transactionType:
          form.transactionType,


        propertyType:
          form.propertyType,


        location:
          form.location,


        locality:
          form.locality,


        googleMapLink:
          form.googleMapLink,


        price:
          Number(form.price),


        bedrooms:
          Number(form.bedrooms),


        bathrooms:
          Number(form.bathrooms),


        carpetArea:
          Number(form.carpetArea),


        plotArea:
          Number(form.plotArea),


        builtUpArea:
          Number(form.builtUpArea),


        furnishing:
          form.furnishing,


        description:
          form.description,


        amenities:
          form.amenities
            .split(",")
            .map(x=>x.trim())
            .filter(Boolean),


        status:
          form.status,


        advisor:
          form.advisor,


        note:
          form.note,

      }

    )


    router.push(
      `/properties/${slug}`
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


      <h1 className="text-3xl font-bold">
        Edit Property
      </h1>



      <div className="rounded-2xl border bg-card p-8 space-y-5">



        <Input
          placeholder="Property Name"
          value={form.name}
          onChange={
            e=>update(
              "name",
              e.target.value
            )
          }
        />



        <Input
          placeholder="Developer"
          value={form.developer}
          onChange={
            e=>update(
              "developer",
              e.target.value
            )
          }
        />





        <select
          className="w-full rounded-lg border p-3"
          value={form.transactionType}
          onChange={
            e=>update(
              "transactionType",
              e.target.value
            )
          }
        >

          {
            transactionTypes.map(
              item=>(

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
            e=>update(
              "propertyType",
              e.target.value
            )
          }
        >

          {
            propertyTypes.map(
              item=>(

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





        <div className="grid md:grid-cols-2 gap-4">

          <Input
            placeholder="Location"
            value={form.location}
            onChange={
              e=>update(
                "location",
                e.target.value
              )
            }
          />


          <Input
            placeholder="Locality"
            value={form.locality}
            onChange={
              e=>update(
                "locality",
                e.target.value
              )
            }
          />

        </div>





        <Input
          placeholder="Google Map Link"
          value={form.googleMapLink}
          onChange={
            e=>update(
              "googleMapLink",
              e.target.value
            )
          }
        />





        <Input
          placeholder="Price"
          value={form.price}
          onChange={
            e=>update(
              "price",
              e.target.value
            )
          }
        />





        <div className="grid md:grid-cols-3 gap-4">

          <Input
            placeholder="Bedrooms"
            value={form.bedrooms}
            onChange={
              e=>update(
                "bedrooms",
                e.target.value
              )
            }
          />


          <Input
            placeholder="Bathrooms"
            value={form.bathrooms}
            onChange={
              e=>update(
                "bathrooms",
                e.target.value
              )
            }
          />


          <Input
            placeholder="Carpet Area"
            value={form.carpetArea}
            onChange={
              e=>update(
                "carpetArea",
                e.target.value
              )
            }
          />

        </div>





        <div className="grid md:grid-cols-2 gap-4">

          <Input
            placeholder="Plot Area"
            value={form.plotArea}
            onChange={
              e=>update(
                "plotArea",
                e.target.value
              )
            }
          />


          <Input
            placeholder="Built Up Area"
            value={form.builtUpArea}
            onChange={
              e=>update(
                "builtUpArea",
                e.target.value
              )
            }
          />

        </div>





        <Input
          placeholder="Furnishing"
          value={form.furnishing}
          onChange={
            e=>update(
              "furnishing",
              e.target.value
            )
          }
        />





        <Input
          placeholder="Amenities"
          value={form.amenities}
          onChange={
            e=>update(
              "amenities",
              e.target.value
            )
          }
        />





        <Textarea
          placeholder="Property Description"
          value={form.description}
          onChange={
            e=>update(
              "description",
              e.target.value
            )
          }
        />





        <Input
          placeholder="Advisor"
          value={form.advisor}
          onChange={
            e=>update(
              "advisor",
              e.target.value
            )
          }
        />





        <Textarea
          placeholder="Internal Notes"
          value={form.note}
          onChange={
            e=>update(
              "note",
              e.target.value
            )
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