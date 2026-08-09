"use client"

import {
  User,
  Phone,
  Mail,
  Percent,
  Pencil,
  Trash2,
  Plus,
} from "lucide-react"

import Link from "next/link"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import type {
  PropertySource,
} from "@/lib/repositories/property-contact-repository"

import {
  removePropertyContact,
} from "@/lib/repositories/property-contact-repository"

import {
  AddPropertySourceDrawer,
} from "@/components/properties/add-property-source-drawer"

import {
  EditPropertySourceDrawer,
} from "@/components/properties/edit-property-source-drawer"

import type {
  TransactionType,
} from "@/types/property"

import {
  Button,
} from "@/components/ui/button"





type Props = {

  sources: PropertySource[]

  contacts:{
    id:string
    firstName?:string
    lastName?:string | null
    fullName?:string
  }[]

  propertyId:string

  propertyValue:number

  transactionType:TransactionType

}






function sourceLabel(
  type:string
){

  switch(type){

    case "owner":
      return "Owner"

    case "developer":
      return "Developer"

    case "mou_holder":
      return "MOU Holder"

    case "broker":
      return "Broker"

    default:
      return type

  }

}







export function PropertySourcesCard({

  sources,

  contacts,

  propertyId,

  propertyValue,

  transactionType,

}:Props){



  const router =
    useRouter()



  const [
    open,
    setOpen,
  ] =
  useState(false)



  const [
    editingSource,
    setEditingSource,
  ] =
  useState<PropertySource | null>(null)





  async function removeSource(
    id:string
  ){


    const confirmDelete =
      window.confirm(
        "Remove this source?"
      )


    if(!confirmDelete){

      return

    }



    await removePropertyContact(
      id
    )



    router.refresh()


  }







  return (

    <section className="
      rounded-3xl
      border
      bg-card
      p-6
      space-y-5
    ">


      <div className="
        flex
        items-center
        justify-between
      ">


        <h2 className="
          text-xl
          font-semibold
        ">

          Property Sources

        </h2>





        <Button

          size="sm"

          onClick={() =>
            setOpen(true)
          }

        >

          <Plus className="h-4 w-4 mr-2"/>

          Add Source

        </Button>


      </div>









      {
        sources.length === 0

        ?

        <p className="
          text-sm
          text-muted-foreground
        ">

          No sources added.

        </p>


        :


        <div className="
          grid
          gap-4
          md:grid-cols-2
        ">


        {
          sources.map(

            source => {


              const percentage =
                source.commission?.percentage



              const commissionValue =
                percentage !== undefined
                  ? propertyValue * percentage / 100
                  : undefined



              return (

              <div

                key={
                  source.id
                }

                className="
                  rounded-2xl
                  border
                  p-5
                  space-y-3
                "

              >





                <div className="
                  flex
                  items-center
                  justify-between
                ">


                  <div className="
                    text-sm
                    font-semibold
                    uppercase
                    text-muted-foreground
                  ">

                    {
                      sourceLabel(
                        source.relationshipType
                      )
                    }

                  </div>




                  <div className="flex items-center gap-1">

                  <Button

                    variant="ghost"

                    size="icon"

                    aria-label="Edit property source"

                    onClick={() =>
                      setEditingSource(source)
                    }

                  >

                    <Pencil className="h-4 w-4"/>

                  </Button>



                  <Button

                    variant="ghost"

                    size="icon"

                    onClick={() =>
                      removeSource(
                        source.id
                      )
                    }

                  >

                    <Trash2 className="h-4 w-4"/>

                  </Button>

                  </div>


                </div>







                <div className="
                  flex
                  items-center
                  gap-2
                  font-medium
                ">


                  <User className="h-4 w-4"/>


                  {
                    source.contact.id

                    ?

                    <Link

                      href={
                        `/contacts/${source.contact.id}`
                      }

                      className="hover:underline"

                    >

                      {
                        source.contact.name
                      }

                    </Link>


                    :

                    source.contact.name

                  }


                </div>







                {
                  source.contact.phone && (

                    <div className="
                      flex
                      items-center
                      gap-2
                      text-sm
                    ">


                      <Phone className="h-4 w-4"/>


                      {source.contact.phone}


                    </div>

                  )
                }







                {
                  source.contact.email && (

                    <div className="
                      flex
                      items-center
                      gap-2
                      text-sm
                    ">


                      <Mail className="h-4 w-4"/>


                      {source.contact.email}


                    </div>

                  )
                }








                {
                  percentage !== undefined && (

                    <div className="
                      flex
                      items-center
                      gap-2
                      text-sm
                      font-medium
                    ">


                      <Percent className="h-4 w-4"/>


                      Commission:

                      {" "}

                      {
                        percentage
                      }%


                      {
                        commissionValue !== undefined && (

                          <span className="text-muted-foreground">
                            (₹{commissionValue.toLocaleString("en-IN")} of property value)
                          </span>

                        )
                      }


                    </div>

                  )
                }


              </div>

              )

            }

          )
        }


        </div>

      }





      <AddPropertySourceDrawer

        open={
          open
        }

        onOpenChange={
          setOpen
        }

        propertyId={
          propertyId
        }

        contacts={
          contacts
        }

        onAdded={() =>
          router.refresh()
        }

      />



      {
        editingSource && (

          <EditPropertySourceDrawer
            key={editingSource.id}
            open={true}
            onOpenChange={
              open => {

                if(!open){

                  setEditingSource(null)

                }

              }
            }
            propertyId={propertyId}
            propertyValue={propertyValue}
            transactionType={transactionType}
            source={editingSource}
            contacts={contacts}
            onSaved={() =>
              router.refresh()
            }
          />

        )
      }


    </section>

  )

}
