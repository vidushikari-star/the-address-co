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
}: Props) {


  const [
    matches,
    setMatches,
  ] =
  useState<Property[]>([])





  useEffect(() => {


    async function loadMatches(){


      try {


        const properties =
          await getProperties()



        const matched =
          getPropertyMatches(
            contact,
            properties
          )



        setMatches(

          matched
            .map(
              item =>
                item.property
            )
            .slice(
              0,
              5
            )

        )


      } catch(error){


        console.error(
          "Failed loading property matches",
          error
        )


      }


    }




    loadMatches()


  },[contact])








  return (

    <Card>


      <CardHeader className="px-4 py-3">


        <CardTitle className="flex items-center justify-between text-base">


          <span>
            Recommended Properties
          </span>



          <Badge variant="secondary">

            {matches.length}

          </Badge>


        </CardTitle>


      </CardHeader>






      <CardContent className="space-y-3 px-4 pb-4">



        {
          matches.length === 0 ? (

            <p className="text-sm text-muted-foreground">

              No matching properties.

            </p>


          ) : (


            matches.map(

              property => (

                <PropertyCard

                  key={
                    property.id
                  }

                  property={
                    property
                  }

                />

              )

            )


          )
        }



      </CardContent>


    </Card>

  )

}