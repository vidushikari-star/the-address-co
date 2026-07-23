"use client"

import { useEffect, useState } from "react"

import type { Contact } from "@/types/contact"
import type { Property } from "@/types/property"

import {
  getProperties,
} from "@/lib/repositories/property-repository"

import {
  getPropertyMatches,
} from "@/lib/services/property-matching"

import { PropertyCard } from "@/components/properties/property-card"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"


type Props = {
  contact: Contact
}


export function RelationshipProperties({
  contact,
}: Props) {

  const [
    matches,
    setMatches,
  ] = useState<Property[]>([])


  useEffect(() => {

    async function loadMatches() {

      const properties =
        await getProperties()


      const matched =
        getPropertyMatches(
          contact,
          properties
        )


      setMatches(
        matched.map(
          (item) => item.property
        )
      )
    }


    loadMatches()

  }, [contact])


  return (
    <Card>

      <CardHeader>
        <CardTitle>
          Recommended Properties
        </CardTitle>
      </CardHeader>


      <CardContent className="space-y-4">

        {matches.length === 0 ? (

          <p className="text-sm text-muted-foreground">
            No matching properties.
          </p>

        ) : (

          matches.map(
            (property) => (

              <PropertyCard
                key={property.id}
                property={property}
              />

            )
          )

        )}

      </CardContent>

    </Card>
  )
}