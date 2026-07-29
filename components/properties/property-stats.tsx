"use client"

import type {
  Property,
} from "@/types/property"

import {
  StatsRow,
} from "@/components/layout/stats-row"





type Props = {

  properties: Property[]

}








export function PropertyStats({
  properties,
}:Props){


  const total =
    properties.length



  const available =
    properties.filter(
      property =>
        property.status === "available"
    )
    .length



  const resale =
    properties.filter(
      property =>
        property.listingType === "Resale"
    )
    .length



  const buyerMatches =
    properties.reduce(
      (
        total,
        property
      ) =>
        total +
        (
          property.buyerMatches ?? 0
        ),
      0
    )







  return (

    <StatsRow

      stats={[
        {
          label:"Properties",
          value:String(total),
        },

        {
          label:"Available",
          value:String(available),
        },

        {
          label:"Resale",
          value:String(resale),
        },

        {
          label:"Buyer Matches",
          value:String(buyerMatches),
        },

      ]}

    />

  )

}