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



const listingTypes = [
  "Primary",
  "Resale",
]



const propertyTypes = [
  "Villa",
  "Apartment",
  "Plot",
  "Penthouse",
  "Commercial",
]



const developmentStages = [
  "under_construction",
  "ready_to_move",
  "resale",
]



const statuses = [
  "available",
  "viewed",
  "shortlisted",
  "offer",
  "purchased",
  "rejected",
  "archived",
]

function numberOrUndefined(value:string){
  return value.trim() ? Number(value) : undefined
}







export default function EditPropertyPage(){


  const router =
    useRouter()



  const params =
    useParams()



  const slug =
    params.slug as string






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
    id,
    setId,
  ] =
  useState("")







  const [
    form,
    setForm,
  ] =
  useState({


    name:"",


    developer:"",



    transactionType:
      "Sale",



    listingType:
      "Primary",



    propertyType:
      "Villa",



    developmentStage:
      "ready_to_move",



    status:
      "available",



    location:"",


    locality:"",



    googleMapLink:"",



    price:"",

    
    
    securityDeposit:"",



    bedrooms:"",



    bathrooms:"",



    carpetArea:"",



    plotArea:"",



    builtUpArea:"",



    furnishing:"",



    description:"",



    amenities:"",



    tags:"",



    coverImage:"",



    advisor:"",



    note:"",

    housingEnabled:false,


  })









  useEffect(()=>{


    async function load(){


      try{


        const property =
          await getPropertyBySlug(
            slug
          )



        if(!property){

          return

        }





        setId(
          property.id
        )





        setForm({

          name:
            property.name ?? "",



          developer:
            property.developer ?? "",



          transactionType:
            property.transactionType
            ?? "Sale",



          listingType:
            property.listingType
            ?? "Primary",



          propertyType:
            property.propertyType
            ?? "Villa",



          developmentStage:
            property.developmentStage
            ?? "ready_to_move",



          status:
            property.status
            ?? "available",



          location:
            property.location
            ?? "",



          locality:
            property.locality
            ?? "",



          googleMapLink:
            property.googleMapLink
            ?? "",



          price:
  String(
    property.transactionType === "Rental"
      ? property.price?.rent
      : property.price?.asking
    ?? ""
  ),

  securityDeposit:
  String(
    property.price?.securityDeposit
    ?? ""
  ),



          bedrooms:
            String(
              property.specifications?.bedrooms
              ?? ""
            ),



          bathrooms:
            String(
              property.specifications?.bathrooms
              ?? ""
            ),



          carpetArea:
            String(
              property.specifications?.carpetArea
              ?? ""
            ),



          plotArea:
            String(
              property.specifications?.plotArea
              ?? ""
            ),



          builtUpArea:
            String(
              property.specifications?.builtUpArea
              ?? ""
            ),



          furnishing:
            property.furnishing
            ?? "",



          description:
            property.description
            ?? "",



          amenities:
            property.amenities?.join(", ")
            ?? "",



          tags:
            property.tags?.join(", ")
            ?? "",



          coverImage:
            property.coverImage
            ?? "",



          advisor:
            property.advisor
            ?? "",



          note:
            property.note
            ?? "",

          housingEnabled:
            property.housingEnabled
            ?? false,


        })


      }
      catch(error){


        console.error(
          "Failed loading property",
          error
        )


      }
      finally{


        setLoading(false)


      }


    }



    load()


  },[
    slug,
  ])









  function update(
    key:string,
    value:string | boolean
  ){

    setForm(
      current => ({

        ...current,

        [key]:
          value,

      })
    )

  }









  async function save(){


    setSaving(true)



    try{


      await updateProperty(

        id,

        {


          name:
            form.name,



          developer:
            form.developer,



          transactionType:
            form.transactionType,



          listingType:
            form.listingType,



          propertyType:
            form.propertyType,



          developmentStage:
            form.developmentStage,



          status:
            form.status,



          location:
            form.location,



          locality:
            form.locality,



          googleMapLink:
            form.googleMapLink,



          price:
  form.transactionType === "Rental"
    ? undefined
    : numberOrUndefined(form.price),

rent:
  form.transactionType === "Rental"
    ? numberOrUndefined(form.price)
    : undefined,

    securityDeposit:
  form.transactionType === "Rental"
    ? numberOrUndefined(form.securityDeposit)
    : undefined,



          bedrooms:
            numberOrUndefined(form.bedrooms),



          bathrooms:
            numberOrUndefined(form.bathrooms),



          carpetArea:
            numberOrUndefined(form.carpetArea),



          plotArea:
            numberOrUndefined(form.plotArea),



          builtUpArea:
            numberOrUndefined(form.builtUpArea),



          furnishing:
            form.furnishing || undefined,



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

          housingEnabled:
            form.housingEnabled,


        }

      )



      router.push(
        `/properties/${slug}`
      )


    }
    catch(error){


      console.error(
        "Failed updating property",
        error
      )


      alert(
        "Unable to update property"
      )


    }
    finally{


      setSaving(false)


    }


  }
    if(loading){

    return (

      <div className="
        rounded-2xl
        border
        p-8
        text-center
        text-muted-foreground
      ">

        Loading property...

      </div>

    )

  }







  return (

    <div className="
      mx-auto
      max-w-4xl
      space-y-6
      p-4
      sm:p-6
      lg:p-8
    ">



      <div>


        <h1 className="
          text-3xl
          font-semibold
        ">

          Edit Property

        </h1>



        <p className="
          mt-2
          text-muted-foreground
        ">

          Update property details, pricing and inventory information.

        </p>


      </div>









      <form

        onSubmit={
          e => {
            e.preventDefault()
            save()
          }
        }

        className="
          space-y-5
          rounded-2xl
          border
          bg-card
          p-4
          sm:p-6
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







        <select

          className="w-full rounded-xl border p-3"

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

                  {item === "Rental" ? "Rent" : item}

                </option>

              )
            )
          }

        </select>








        <select

          className="w-full rounded-xl border p-3"

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

          className="w-full rounded-xl border p-3"

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

          className="w-full rounded-xl border p-3"

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

                  {item === "ready_to_move"
                    ? "Ready to Move"
                    : item === "under_construction"
                      ? "Under Construction"
                      : "Resale"}

                </option>

              )
            )
          }

        </select>








        <select

          className="w-full rounded-xl border p-3"

          value={form.status}

          onChange={
            e =>
              update(
                "status",
                e.target.value
              )
          }

        >

          {
            statuses.map(
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

          value={form.googleMapLink}

          onChange={
            e =>
              update(
                "googleMapLink",
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

        {
  form.transactionType === "Rental" && (

    <Input

      placeholder="Security Deposit"

      type="number"

      value={
        form.securityDeposit
      }

      onChange={
        e =>
          update(
            "securityDeposit",
            e.target.value
          )
      }

    />

  )
}









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









        <div className="
          grid
          gap-4
          md:grid-cols-2
        ">


          <Input

            placeholder="Plot Area"

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

            placeholder="Built Up Area"

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









        <select
          className="w-full rounded-xl border p-3"
          value={form.furnishing}
          onChange={event => update("furnishing", event.target.value)}
        >
          <option value="">Furnishing not specified</option>
          <option value="furnished">Furnished</option>
          <option value="semi_furnished">Semi-furnished</option>
          <option value="unfurnished">Unfurnished</option>
        </select>

        <label className="flex items-start gap-3 rounded-xl border p-4">
          <input
            className="mt-1 h-4 w-4"
            type="checkbox"
            checked={form.housingEnabled}
            onChange={event => update("housingEnabled", event.target.checked)}
          />
          <span>
            <span className="block text-sm font-medium">Syndicate to Housing.com</span>
            <span className="block text-sm text-muted-foreground">Only enabled active listings are published to Housing.com.</span>
          </span>
        </label>









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

          type="submit"

          disabled={saving}

        >

          {
            saving
              ? "Saving..."
              : "Save Changes"
          }

        </Button>





      </form>


    </div>

  )

}
