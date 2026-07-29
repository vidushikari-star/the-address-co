"use client"

import {
  useState,
} from "react"

import {
  FormDrawer,
} from "./form-drawer"

import {
  Input,
} from "@/components/ui/input"

import {
  Button,
} from "@/components/ui/button"

import {
  Textarea,
} from "@/components/ui/textarea"

import {
  createProperty,
} from "@/lib/repositories/property-repository"



type PropertyDrawerProps = {

  open:boolean

  onOpenChange:(open:boolean)=>void

}





function createSlug(
  value:string
){

  return value
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /(^-|-$)/g,
      ""
    )

}







export function PropertyDrawer({

  open,

  onOpenChange,

}:PropertyDrawerProps){





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


    name:"",

    slug:"",

    developer:"",

    transactionType:"Sale",

propertyType:"Villa",


    location:"",

    locality:"",


listingType:"Primary",

    developmentStage:"ready_to_move",



    price:"",


    bedrooms:"",

    bathrooms:"",

    carpetArea:"",

    plotArea:"",

    builtUpArea:"",



    furnishing:"unfurnished",


    amenities:"",


    googleMapLink:"",


    description:"",



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


        ...(key==="name"
          ? {
              slug:
                createSlug(value)
            }
          : {})


      })
    )

  }







  async function submit(
    e:React.FormEvent
  ){


    e.preventDefault()


    setLoading(true)



    try{


      await createProperty({

        name:
          form.name,


        slug:
          form.slug,


        developer:
          form.developer,

          transactionType:
  form.transactionType,


propertyType:
  form.propertyType,


        listingType:
          form.listingType,

          


        developmentStage:
          form.developmentStage,


    



        status:
          "available",



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



        advisor:
          form.advisor,



        note:
          form.note,



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


      })



      onOpenChange(false)



    }
    catch(error){


      console.error(
        "Property creation failed",
        error
      )


      alert(
        "Property creation failed"
      )


    }
    finally{


      setLoading(false)


    }


  }








  return (

    <FormDrawer

      open={open}

      onOpenChange={onOpenChange}

      title="New Property"

      description="Add luxury inventory."

    >


      <form

        onSubmit={submit}

        className="space-y-5"

      >



        <Input

          placeholder="Property Name"

          value={
            form.name
          }

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

          value={
            form.developer
          }

          onChange={
            e =>
              update(
                "developer",
                e.target.value
              )
          }

        />

        <select

  className="w-full rounded-lg border p-3"

  value={
    form.transactionType
  }

  onChange={
    e =>
      update(
        "transactionType",
        e.target.value
      )
  }

>

  <option value="Sale">
    Sale
  </option>


  <option value="Rental">
    Rental
  </option>

</select>





<select

  className="w-full rounded-lg border p-3"

  value={
    form.propertyType
  }

  onChange={
    e =>
      update(
        "propertyType",
        e.target.value
      )
  }

>

  <option value="Villa">
    Villa
  </option>


  <option value="Apartment">
    Apartment
  </option>


  <option value="Plot">
    Plot
  </option>


  <option value="Penthouse">
    Penthouse
  </option>


  <option value="Commercial">
    Commercial
  </option>

</select>





        <div className="grid grid-cols-2 gap-3">


          <Input

            placeholder="Location"

            value={
              form.location
            }

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

            value={
              form.locality
            }

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

          placeholder="Price"

          type="number"

          value={
            form.price
          }

          onChange={
            e =>
              update(
                "price",
                e.target.value
              )
          }

        />







        <div className="grid grid-cols-3 gap-3">


          <Input

            placeholder="Bedrooms"

            value={
              form.bedrooms
            }

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

            value={
              form.bathrooms
            }

            onChange={
              e =>
                update(
                  "bathrooms",
                  e.target.value
                )
            }

          />



          <Input

            placeholder="Carpet Area"

            value={
              form.carpetArea
            }

            onChange={
              e =>
                update(
                  "carpetArea",
                  e.target.value
                )
            }

          />


        </div>






        <div className="grid grid-cols-2 gap-3">


          <Input

            placeholder="Plot Area"

            value={
              form.plotArea
            }

            onChange={
              e =>
                update(
                  "plotArea",
                  e.target.value
                )
            }

          />



          <Input

            placeholder="Built Up Area"

            value={
              form.builtUpArea
            }

            onChange={
              e =>
                update(
                  "builtUpArea",
                  e.target.value
                )
            }

          />


        </div>







        <select

          className="w-full rounded-lg border p-3"

          value={
            form.furnishing
          }

          onChange={
            e =>
              update(
                "furnishing",
                e.target.value
              )
          }

        >

          <option value="furnished">
            Furnished
          </option>

          <option value="semi_furnished">
            Semi Furnished
          </option>

          <option value="unfurnished">
            Unfurnished
          </option>

        </select>







        <Input

          placeholder="Amenities (comma separated)"

          value={
            form.amenities
          }

          onChange={
            e =>
              update(
                "amenities",
                e.target.value
              )
          }

        />








        <Textarea

          placeholder="Property Description"

          value={
            form.description
          }

          onChange={
            e =>
              update(
                "description",
                e.target.value
              )
          }

        />







        <Input

          placeholder="Advisor"

          value={
            form.advisor
          }

          onChange={
            e =>
              update(
                "advisor",
                e.target.value
              )
          }

        />








        <Textarea

          placeholder="Internal Notes"

          value={
            form.note
          }

          onChange={
            e =>
              update(
                "note",
                e.target.value
              )
          }

        />







        <Button

          type="submit"

          disabled={
            loading
          }

        >

          {
            loading
              ? "Saving..."
              : "Create Property"
          }


        </Button>


      </form>


    </FormDrawer>

  )

}