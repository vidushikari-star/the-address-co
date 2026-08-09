import {
  getProperties,
} from "@/lib/repositories/property-repository"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
  getBuyerMatches,
} from "@/lib/services/buyer-matching"

import type {
  Property,
} from "@/types/property"


export async function getPropertyCardData(): Promise<Property[]> {

  const [
    properties,
    contacts,
  ] = await Promise.all([

    getProperties(),

    ContactsRepository.getAll(),

  ])


  const enriched =
    await Promise.all(

      properties.map(
        async (property) => {


          const buyerMatches =
            getBuyerMatches(
              property,
              contacts
            )


          const {
            data: latestShare,
          } = await getLatestPropertyShare(
            property.id
          )


          return {

            ...property,

            buyerMatches:
              buyerMatches.length,

            lastShared:
              latestShare
                ? new Date(
                    latestShare
                  ).toLocaleDateString(
                    "en-IN",
                    {
                      day:"2-digit",
                      month:"short",
                      year:"numeric",
                    }
                  )
                : "Never",

          }

        }
      )

    )


  return enriched

}



async function getLatestPropertyShare(
propertyId:string
){

  const {
    supabase,
  } = await import(
    "@/lib/supabase/client"
  )


  const {
    data,
    error,
  } =
    await supabase
      .from("property_shares")
      .select(
        "created_at"
      )
      .eq(
        "property_id",
        propertyId
      )
      .order(
        "created_at",
        {
          ascending:false,
        }
      )
      .limit(1)
      .maybeSingle()


  if(error){
    console.error(
      "Failed loading last shared",
      error
    )

    return {
      data:null
    }
  }


  return {
    data:
      data?.created_at ?? null
  }

}
