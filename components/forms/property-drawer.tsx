"use client"

import {
  useEffect,
  useRef,
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
deleteProperty,
} from "@/lib/repositories/property-repository"

import {
  uploadPropertyImage,
} from "@/lib/repositories/property-image-repository"

import {
  ImagePlus,
} from "lucide-react"

import {
  uploadPropertyDocument,
} from "@/lib/repositories/property-document-repository"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
  addPropertyContact,
} from "@/lib/repositories/property-contact-repository"

import {
  addPropertyCommission,
} from "@/lib/repositories/property-commission-repository"

import {
  addContactRelationshipType,
} from "@/lib/supabase/repositories/contact-relationship.repository"



type PropertyDrawerProps = {

  open:boolean

  onOpenChange:(open:boolean)=>void

  housingLead?: {

    projectName?: string

    locality?: string

    propertyType?: string

    housingId?: string

  }

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
      "")

}







export function PropertyDrawer({

  open,

  onOpenChange,

  housingLead,

}:PropertyDrawerProps){


const [
  contacts,
  setContacts,
] = useState<any[]>([])


const [
  propertySources,
  setPropertySources,
] =
useState<
  {
    contactId:string
    relationshipType:
      | "owner"
      | "developer"
      | "mou_holder"
      | "broker"

    commissionPercentage:string

  }[]
>([])


  const [
    loading,
    setLoading,
  ] =
  useState(false)





  const imageInputRef =
    useRef<HTMLInputElement>(null)

    const documentInputRef =
  useRef<HTMLInputElement>(null)





  const [
    images,
    setImages,
  ] =
  useState<File[]>([])

  const [
  documents,
  setDocuments,
] =
useState<File[]>([])





  const [
  previews,
  setPreviews,
] =
useState<
  {
    url:string
    type:"image" | "video"
  }[]
>([])









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

    rent:"",

    securityDeposit:"",





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

    housingListingId:
  housingLead?.housingId
  ??
  "",


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








  function selectImages(
    files:FileList | null
  ){

    if(!files){

      return

    }



    const selected =
      Array.from(files)



    setImages(
      current => [
        ...current,
        ...selected,
      ]
    )



    setPreviews(
  current => [

    ...current,

    ...selected.map(
      file => ({
        url:
          URL.createObjectURL(
            file
          ),

        type:
  file.type.startsWith("video/")
    ? ("video" as const)
    : ("image" as const),
      })
    ),

  ]
)

  }








  function removeImage(
    index:number
  ){

    setImages(
      current =>
        current.filter(
          (_,i)=>
            i !== index
        )
    )


    setPreviews(
      current =>
        current.filter(
          (_,i)=>
            i !== index
        )
    )

  }



function removeDocument(index:number){

  setDocuments(
    current =>
      current.filter(
        (_,i)=>i !== index
      )
  )

}



  function resetForm(){

  setForm({

 name:
   housingLead?.projectName
   ??
   "",

 slug:"",

 developer:"",

 transactionType:"Sale",


    propertyType:
      housingLead?.propertyType
        ?.toLowerCase()
        .includes("apartment")
        ? "Apartment"
        :
      housingLead?.propertyType
        ?.toLowerCase()
        .includes("plot")
        ? "Plot"
        :
      housingLead?.propertyType
        ?.toLowerCase()
        .includes("commercial")
        ? "Commercial"
        :
      housingLead?.propertyType
        ?.toLowerCase()
        .includes("penthouse")
        ? "Penthouse"
        :
      "Villa",



    location:"",


    locality:
      housingLead?.locality
      ??
      "",



    listingType:"Primary",


    developmentStage:"ready_to_move",



    price:"",

    rent:"",

    securityDeposit:"",



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

    housingListingId:"",


  })



  setImages([])

  setPreviews([])

  setDocuments([])

  setPropertySources([])



  if(imageInputRef.current){

    imageInputRef.current.value = ""

  }



  if(documentInputRef.current){

    documentInputRef.current.value = ""

  }

}



async function loadContacts(){

try {

  const data =
    await ContactsRepository.getAll()


  console.log(
    "PROPERTY CONTACTS:",
    data
  )


  setContacts(
    data
  )


}
catch(error){

  console.error(
    "Failed loading contacts",
    error
  )

}

}


  useEffect(()=>{

if(open){

  resetForm()

  loadContacts()

}

},[open])





    async function submit(
e:React.FormEvent
){

e.preventDefault()

setLoading(true)

let createdPropertyId:string | null = null

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
            form.transactionType === "Sale"
              ? Number(form.price)
              : undefined,



          rent:
            form.transactionType === "Rental"
              ? Number(form.rent)
              : undefined,



          securityDeposit:
            form.transactionType === "Rental"
              ? Number(form.securityDeposit)
              : undefined,




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

            housingListingId:
  form.housingListingId,



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

        createdPropertyId =
property.id

              for(
        const source of propertySources
      ){

        if(
          !source.contactId
        ){

          continue

        }


        await addPropertyContact({

          propertyId:
            property.id,

          contactId:
            source.contactId,

          relationshipType:
            source.relationshipType,

        })

        await addContactRelationshipType(
  source.contactId,
  source.relationshipType
)



        if(
          source.commissionPercentage
        ){

          await addPropertyCommission({

            propertyId:
              property.id,

            contactId:
              source.contactId,

              transactionType:
  form.transactionType as "Sale" | "Rental",

            sourceType:
              source.relationshipType,

            commissionType:
              "percentage",

            percentage:
              Number(
                source.commissionPercentage
              ),

          })

        }

      }







      await Promise.all(

        images.map(

          image =>

            uploadPropertyImage(
              property.id,
              image
            )

        )

      )

      await Promise.all(

  documents.map(

    document =>

      uploadPropertyDocument(
        property.id,
        document,
        "brochure"
      )

  )

)






      resetForm()


      onOpenChange(false)



    }
    catch(error){

console.error(
"Property creation failed",
error
)


if(
createdPropertyId
){

try{

await deleteProperty(
createdPropertyId
)

}
catch(deleteError){

console.error(
"Failed rolling back property",
deleteError
)

}

}


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

      onOpenChange={(value)=>{

        if(!value){

          resetForm()

        }

        onOpenChange(value)

      }}

      title="New Property"

      description="Add luxury inventory."

    >


      <form

        onSubmit={submit}

        className="space-y-5"

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

          <option value="Sale">
            Sale
          </option>

          <option value="Rental">
            Rental
          </option>

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





        {
          form.transactionType === "Rental"

          ? (

            <>

              <Input

                placeholder="Monthly Rent"

                type="number"

                value={form.rent}

                onChange={
                  e =>
                    update(
                      "rent",
                      e.target.value
                    )
                }

              />


              <Input

                placeholder="Security Deposit"

                type="number"

                value={form.securityDeposit}

                onChange={
                  e =>
                    update(
                      "securityDeposit",
                      e.target.value
                    )
                }

              />

            </>

          )

          : (

            <Input

              placeholder="Sale Price"

              type="number"

              value={form.price}

              onChange={
                e =>
                  update(
                    "price",
                    e.target.value
                  )
              }

            />

          )
        }






        <div className="grid grid-cols-3 gap-3">

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





        <div className="grid grid-cols-2 gap-3">

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

          className="w-full rounded-lg border p-3"

          value={form.furnishing}

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

          value={form.amenities}

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

          value={form.description}

          onChange={
            e =>
              update(
                "description",
                e.target.value
              )
          }

        />





        {/* IMAGE SELECTOR */}

        <div className="
          space-y-3
          rounded-lg
          border
          p-4
        ">

          <p className="text-sm font-medium">
            Property Images
          </p>


          <input

  ref={imageInputRef}

  type="file"

  accept="image/*,video/*"

  multiple

            hidden

            onChange={
              e =>
                selectImages(
                  e.target.files
                )
            }

          />



          <Button

            type="button"

            variant="outline"

            onClick={() =>
              imageInputRef.current?.click()
            }

          >

            <ImagePlus className="mr-2 h-4 w-4"/>

            Choose Media

          </Button>





          {
            previews.length > 0 && (

              <div className="
                grid
                grid-cols-3
                gap-3
              ">


                {
                  previews.map(
                    (preview,index)=>(

                      <div
                        key={preview.url}
                        className="relative"
                      >

                        {
  preview.type === "video" ? (

    <video

      src={preview.url}

      controls

      className="
        h-20
        w-full
        rounded-lg
        object-cover
      "

    />

  ) : (

    <img

      src={preview.url}

      className="
        h-20
        w-full
        rounded-lg
        object-cover
      "

    />

  )
}


                        <button

                          type="button"

                          onClick={() =>
                            removeImage(index)
                          }

                          className="
                            absolute
                            right-1
                            top-1
                            rounded-full
                            bg-black
                            px-2
                            text-xs
                            text-white
                          "

                        >

                          ×

                        </button>


                      </div>

                    )
                  )

                }


              </div>

            )
          }


        </div>

        {/* DOCUMENT SELECTOR */}

<div className="
  space-y-3
  rounded-lg
  border
  p-4
">

  <p className="text-sm font-medium">
    Brochures & Documents
  </p>


  <input

    ref={documentInputRef}

    type="file"

    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"

    multiple

    hidden

    onChange={
  e =>
    setDocuments(
      current => [
        ...current,
        ...Array.from(
          e.target.files ?? []
        ),
      ]
    )
}

  />



  <Button

    type="button"

    variant="outline"

    onClick={() =>
      documentInputRef.current?.click()
    }

  >

    Upload Brochure / Documents

  </Button>




  {
    documents.length > 0 && (

      <div className="
        space-y-1
        text-sm
        text-muted-foreground
      ">

        {
  documents.map(
    (document, index) => (

      <div
        key={document.name}
        className="flex items-center justify-between"
      >

        <p>
          📄 {document.name}
        </p>

        <button
          type="button"
          onClick={() => removeDocument(index)}
          className="text-sm text-destructive"
        >
          Remove
        </button>

      </div>

    )
  )
}

      </div>

    )
  }


</div>


<div className="
  space-y-3
  rounded-lg
  border
  p-4
">

<p className="font-medium text-sm">
  Property Source & Commission
</p>


<select

className="w-full rounded-lg border p-3"

value={
 propertySources[0]?.relationshipType ?? "owner"
}

onChange={
  e => {

    const relationshipType =
      e.target.value as
      | "owner"
      | "developer"
      | "mou_holder"
      | "broker"


    setPropertySources(
      current => [

        {

          contactId:
            current[0]?.contactId
            ??
            "",


          relationshipType,


          commissionPercentage:
            current[0]?.commissionPercentage
            ??
            "",

        }

      ]
    )

  }
}

>

<option value="owner">
Owner
</option>

<option value="developer">
Developer
</option>

<option value="mou_holder">
MOU Holder
</option>

<option value="broker">
Broker
</option>

</select>



<select

className="w-full rounded-lg border p-3"

value={
 propertySources[0]?.contactId ?? ""
}

onChange={
  e => {

    const contactId =
      e.target.value


    setPropertySources(
      current => [

        {

          contactId,

          relationshipType:
            current[0]?.relationshipType
            ??
            "owner",


          commissionPercentage:
            current[0]?.commissionPercentage
            ??
            "",

        }

      ]
    )

  }
}

>

<option value="">
Select Contact
</option>


{
contacts.map(
 contact => (

<option
key={contact.id}
value={contact.id}
>

{
 contact.fullName ??
 `${contact.firstName} ${contact.lastName ?? ""}`
}

</option>

)

)

}

</select>



<Input

placeholder="Commission %"

type="number"

value={
 propertySources[0]?.commissionPercentage ?? ""
}

onChange={
 e => {

  const value =
    e.target.value


  setPropertySources(
    current => [

      ...current.filter(
        item =>
          item.relationshipType !==
          propertySources[0]?.relationshipType
      ),


      {

        contactId:
          propertySources[0]?.contactId
          ??
          "",


        relationshipType:
          propertySources[0]?.relationshipType
          ??
          "owner",


        commissionPercentage:
          value,

      }

    ]
  )

 }

}

/>


</div>


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





        <div className="
          flex
          justify-end
          gap-3
        ">


          <Button

            type="button"

            variant="outline"

            onClick={() =>
              onOpenChange(false)
            }

          >

            Cancel

          </Button>



          <Button

            type="submit"

            disabled={loading}

          >

            {
              loading
                ? "Saving..."
                : "Create Property"
            }

          </Button>


        </div>


      </form>


    </FormDrawer>

  )

}