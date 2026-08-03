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
  Input,
} from "@/components/ui/input"

import {
  Textarea,
} from "@/components/ui/textarea"

import {
  Button,
} from "@/components/ui/button"

import {
  createProperty,
} from "@/lib/repositories/property-repository"





const transactionTypes = [
  "Sale",
  "Rental",
]



const listingTypes = [
  "Primary",
  "Resale",
  "Rental",
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



const statuses = [
  "available",
  "viewed",
  "shortlisted",
  "offer",
  "purchased",
  "rejected",
]





const dropdowns = [
  {
    key: "transactionType",
    options: transactionTypes,
  },
  {
    key: "listingType",
    options: listingTypes,
  },
  {
    key: "propertyType",
    options: propertyTypes,
  },
  {
    key: "developmentStage",
    options: developmentStages,
  },
  {
    key: "status",
    options: statuses,
  },
] as const





export default function NewPropertyPage(){


  const router =
    useRouter()





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

    name:"",

    slug:"",

    developer:"",

    transactionType:"Sale",

    listingType:"Primary",

    developmentStage:"ready_to_move",

    propertyType:"Villa",

    status:"available",

    location:"",

    locality:"",

    googleMapLink:"",

    price:"",

    bedrooms:"",

    bathrooms:"",

    carpetArea:"",

    plotArea:"",

    builtUpArea:"",

    furnishing:"",

    amenities:"",

    description:"",

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



    try {


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


          plotArea:
            Number(
              form.plotArea
            ),


          builtUpArea:
            Number(
              form.builtUpArea
            ),


          description:
            form.description,


          amenities:
            form.amenities
              .split(",")
              .map(
                item =>
                  item.trim()
              )
              .filter(Boolean),


          furnishing:
            form.furnishing,


          googleMapLink:
            form.googleMapLink,


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
  `/properties/${property.slug}?created=true`
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
      max-w-4xl
      space-y-8
      p-4
      sm:p-8
    ">


      <div className="flex items-center gap-3">


        <div className="rounded-xl bg-primary/10 p-3">

          <Building2 className="h-6 w-6 text-primary"/>

        </div>




        <div>

          <h1 className="text-3xl font-bold">

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
          space-y-5
          rounded-2xl
          border
          bg-card
          p-4
          sm:p-8
        "

      >




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

          placeholder="Slug (example: casa-brilhante)"

          value={form.slug}

          onChange={
            e =>
              update(
                "slug",
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






        {
          dropdowns.map(
            dropdown => (

              <select

                key={dropdown.key}

                className="
                  w-full
                  rounded-lg
                  border
                  p-3
                "

                value={
                  form[
                    dropdown.key
                  ]
                }

                onChange={
                  e =>
                    update(
                      dropdown.key,
                      e.target.value
                    )
                }

              >

                {
                  dropdown.options.map(
                    option => (

                      <option

                        key={option}

                        value={option}

                      >

                        {option}

                      </option>

                    )
                  )
                }


              </select>


            )
          )
        }







        <div className="
          grid
          gap-4
          md:grid-cols-2
        ">


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

          placeholder="Google Map Link"

          value={
            form.googleMapLink
          }

          onChange={
            e =>
              update(
                "googleMapLink",
                e.target.value
              )
          }

        />








        <Input

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








        <div className="
          grid
          gap-4
          md:grid-cols-3
        ">


          <Input

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

            placeholder="Carpet Area sqft"

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







        <div className="
          grid
          gap-4
          md:grid-cols-2
        ">


          <Input

            placeholder="Plot Area sqm"

            value={form.plotArea}

            onChange={
              e =>
                update(
                  "plotArea",
                  e.target.value
                )
            }

          />



          <Input

            placeholder="Built Up Area sqft"

            value={form.builtUpArea}

            onChange={
              e =>
                update(
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
            e =>
              update(
                "furnishing",
                e.target.value
              )
          }

        />








        <Input

          placeholder="Amenities (comma separated)"

          value={form.amenities}

          onChange={
            e =>
              update(
                "amenities",
                e.target.value
              )
          }

        />








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

          placeholder="Property Description"

          value={form.description}

          onChange={
            e =>
              update(
                "description",
                e.target.value
              )
          }

        />








        <Textarea

          placeholder="Internal Notes"

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