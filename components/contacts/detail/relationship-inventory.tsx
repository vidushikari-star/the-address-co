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
  getPropertyContactsByContactId,
} from "@/lib/repositories/property-contact-repository"

import {
  RecommendedPropertyCard,
} from "./recommended-property-card"

import {
  Badge,
} from "@/components/ui/badge"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"



type RelationshipInventoryProps = {

  contact: Contact

}



export function RelationshipInventory({
  contact,
}: RelationshipInventoryProps) {


  const [
    properties,
    setProperties,
  ] =
  useState<Property[]>([])



  const [
    loading,
    setLoading,
  ] =
  useState(true)



  useEffect(() => {


    let mounted = true


    async function loadInventory() {


      try {


        const [
          allProperties,
          propertyContacts,
        ] =
        await Promise.all([

          getProperties(),

          getPropertyContactsByContactId(
            contact.id
          ),

        ])



        const propertyIds =
          new Set(
            propertyContacts.map(
              item =>
                item.propertyId
            )
          )



        if(mounted){

          setProperties(
            allProperties.filter(
              property =>
                propertyIds.has(
                  property.id
                )
            )
          )

        }


      }
      finally {

        if(mounted){

          setLoading(false)

        }

      }


    }



    loadInventory()



    return () => {

      mounted = false

    }


  }, [
    contact.id,
  ])



  return (

    <Card className="rounded-2xl">

      <CardHeader className="px-4 py-3">

        <CardTitle className="flex items-center justify-between text-base">

          <span>
            Property / Inventory to Sell or Lease
          </span>

          <Badge variant="secondary">
            {properties.length}
          </Badge>

        </CardTitle>

      </CardHeader>



      <CardContent className="space-y-3 px-4 pb-5">

        {
          loading ? (

            <p className="text-sm text-muted-foreground">
              Loading inventory...
            </p>

          )

          :

          properties.length === 0 ? (

            <p className="text-sm text-muted-foreground">
              No sale or lease inventory linked to this contact yet.
            </p>

          )

          :

          properties.map(
            property => (

              <RecommendedPropertyCard
                key={property.id}
                property={property}
                label="inventory"
              />

            )
          )

        }

      </CardContent>

    </Card>

  )

}
