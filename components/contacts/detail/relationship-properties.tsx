"use client"

import {
  useEffect,
  useState,
} from "react"

import type {
  Contact,
} from "@/types/contact"

import type {
  Property,
} from "@/types/property"

import {
  getProperties,
} from "@/lib/repositories/property-repository"

import {
  getPropertySharesByContactId,
} from "@/lib/repositories/property-share-repository"

import {
  getPropertyMatches,
} from "@/lib/services/property-matching"

import {
  PropertyCard,
} from "@/components/properties/property-card"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Badge,
} from "@/components/ui/badge"





type Props = {

  contact: Contact

}








export function RelationshipProperties({
  contact,
}:Props){



  const [
  matches,
  setMatches,
] =
useState<Property[]>([])


const [
  sharedPropertyIds,
  setSharedPropertyIds,
] =
useState<string[]>([])



  const [
    loading,
    setLoading,
  ] =
  useState(true)







  useEffect(()=>{


    async function loadProperties(){


      try{


        const [

          properties,

          sharedProperties,

        ] =
        await Promise.all([

          getProperties(),

          getPropertySharesByContactId(
            contact.id
          ),

        ])





        const sharedIds =
          new Set(
            sharedProperties.map(
              item =>
                item.propertyId
            )
          )





        const manuallyShared =
          properties.filter(
            property =>
              sharedIds.has(
                property.id
              )
          )

          setSharedPropertyIds(
  Array.from(sharedIds)
)





        const recommended =
          getPropertyMatches(
            contact,
            properties
          )
          .map(
            item =>
              item.property
          )





        const combined = [

          ...manuallyShared,

          ...recommended,

        ]





        const unique =
          Array.from(

            new Map(

              combined.map(
                property => [

                  property.id,

                  property

                ]
              )

            )
            .values()

          )





        setMatches(

          unique.slice(
            0,
            5
          )

        )


      }
      finally{

        setLoading(false)

      }


    }



    loadProperties()


  },[
    contact
  ])









  return (

    <Card className="
      rounded-2xl
    ">



      <CardHeader className="
        px-4
        py-3
      ">


        <CardTitle className="
          flex
          items-center
          justify-between
          text-base
        ">


          <span>

            Recommended Properties

          </span>





          <Badge variant="secondary">

            {matches.length}

          </Badge>



        </CardTitle>


      </CardHeader>









      <CardContent className="
        space-y-4
        px-4
        pb-5
      ">






        {
          loading ? (

            <p className="
              text-sm
              text-muted-foreground
            ">

              Finding matching properties...

            </p>

          )

          :


          matches.length === 0 ? (

            <div className="
              rounded-xl
              border
              border-dashed
              p-5
              text-center
              text-sm
              text-muted-foreground
            ">

              No matching properties found.

            </div>

          )


          :

          (

            <div className="
              space-y-4
            ">


              {
  matches.map(
    property => (

      <div
        key={
          property.id
        }
        className="
          space-y-2
        "
      >

        {
          sharedPropertyIds.includes(
            property.id
          ) && (

            <Badge
              variant="secondary"
            >

              ⭐ Shared with Client

            </Badge>

          )
        }


        {
          !sharedPropertyIds.includes(
            property.id
          ) && (

            <Badge
              variant="outline"
            >

              🔎 Recommended Match

            </Badge>

          )
        }



        <PropertyCard

          property={
            property
          }

        />


      </div>

    )

  )

}


            </div>

          )

        }



      </CardContent>


    </Card>

  )

}