"use client"

import {
  User,
  Phone,
  Mail,
  Percent,
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
  Button,
} from "@/components/ui/button"





type Props = {

  sources: PropertySource[]

  contacts:{
    id:string
    fullName?:string
  }[]

  propertyId:string

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

}:Props){



  const router =
    useRouter()



  const [
    open,
    setOpen,
  ] =
  useState(false)





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

            source => (

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
                  source.commission?.percentage && (

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
                        source.commission.percentage
                      }%


                    </div>

                  )
                }


              </div>

            )

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


    </section>

  )

}