"use client"

import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  Search,
} from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"

import {
  Input
} from "@/components/ui/input"

import {
  Card
} from "@/components/ui/card"

import {
  PropertiesRepository,
} from "@/lib/supabase/repositories/properties.repository"


type Property = {

  id: string

  name: string

  slug: string | null

  location: string | null

  property_type: string | null

  bedrooms: number | null

  cover_image: string | null

  public_link: string | null

  public_share_token: string | null

  public_share_enabled: boolean | null

}





type PropertySelectorProps = {

  open: boolean

  onOpenChange: (
    open:boolean
  ) => void


  onSelect: (
    property:Property
  ) => void

}





export function PropertySelector({

  open,

  onOpenChange,

  onSelect,

}:PropertySelectorProps) {


  const [
    properties,
    setProperties,
  ] =
  useState<Property[]>([])



  const [
    search,
    setSearch,
  ] =
  useState("")



  const [
    loading,
    setLoading,
  ] =
  useState(false)





  useEffect(()=>{

    if(!open)
      return



    async function loadProperties(){

  setLoading(true)

  try {

    const data =
      await PropertiesRepository.getAll()

    setProperties(
      data as Property[]
    )

  }
  finally {

    setLoading(false)

  }

}



    loadProperties()


  },[open])







  const filteredProperties =
    useMemo(()=>{


      return properties.filter(
        (property)=>{


          const text =
            `${property.name}
            ${property.location}
            ${property.property_type}`
            .toLowerCase()



          return text.includes(
            search.toLowerCase()
          )


        }
      )


    },[
      properties,
      search
    ])







  return (

    <Sheet

      open={open}

      onOpenChange={onOpenChange}

    >

      <SheetContent
        className="
          sm:max-w-xl
        "
      >

        <SheetHeader>

          <SheetTitle>
            Select Property
          </SheetTitle>


          <SheetDescription>

            Choose a property to share with the client.

          </SheetDescription>


        </SheetHeader>





        <div className="
          mt-6
          space-y-4
        ">



          <div className="
            relative
          ">

            <Search
              className="
                absolute
                left-3
                top-3
                h-4
                w-4
                text-muted-foreground
              "
            />


            <Input

              placeholder="
                Search properties...
              "

              className="
                pl-9
              "

              value={
                search
              }

              onChange={
                (e)=>
                setSearch(
                  e.target.value
                )
              }

            />

          </div>





          {
            loading && (

              <div className="
                py-8
                text-center
                text-sm
                text-muted-foreground
              ">

                Loading properties...

              </div>

            )
          }





          {
            !loading && (

              <div className="
                space-y-3
                max-h-[500px]
                overflow-y-auto
              ">


                {
                  filteredProperties.map(
                    (property)=>(


                      <Card

                        key={
                          property.id
                        }

                        className="
                          cursor-pointer
                          p-4
                          hover:bg-muted
                        "

                        onClick={()=>{

                          onSelect(
                            property
                          )


                          onOpenChange(
                            false
                          )

                        }}

                      >


                        <div className="
                          font-semibold
                        ">

                          {
                            property.name
                          }

                        </div>



                        <div className="
                          mt-1
                          text-sm
                          text-muted-foreground
                        ">

                          {
                            property.location
                          }

                        </div>



                        <div className="
                          mt-2
                          text-sm
                        ">

                          {
                            property.bedrooms
                          }
                          {" "}
                          Bedroom
                          {" "}
                          {
                            property.property_type
                          }

                        </div>


                      </Card>


                    )
                  )

                }




                {
                  filteredProperties.length===0 && (

                    <div className="
                      rounded-lg
                      border
                      p-6
                      text-center
                      text-sm
                      text-muted-foreground
                    ">

                      No properties found.

                    </div>

                  )
                }



              </div>

            )
          }



        </div>


      </SheetContent>


    </Sheet>

  )

}
