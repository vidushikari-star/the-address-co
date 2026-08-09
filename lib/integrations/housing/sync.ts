import { fetchHousingLeads } from "./client"

import {
  ContactsServerRepository,
} from "@/lib/supabase/repositories/contacts-server.repository"

import {
  normalizePhone,
} from "@/lib/utils/phone"

import {
  recordHousingActivity,
} from "./record-housing-activity"





export interface HousingSyncResult {
  imported: number
  updated: number
  skipped: number
}



const contactsRepository =
  ContactsServerRepository

function needsHousingEnrichment(
  existing: Record<string, unknown>,
  incoming: {
    email?: string
    city?: string
    budgetMin?: number
    budgetMax?: number
    propertyType?: string
    locations?: string[]
    housingLeadId?: string
  }
) {
  const existingLocations = Array.isArray(existing.locations)
    ? existing.locations
    : []

  return (
    (!existing.email && incoming.email) ||
    (!existing.city && incoming.city) ||
    (!existing.budget_min && incoming.budgetMin) ||
    (!existing.budget_max && incoming.budgetMax) ||
    (!existing.property_type && incoming.propertyType) ||
    (existingLocations.length === 0 && incoming.locations?.length) ||
    (!existing.housing_lead_id && incoming.housingLeadId)
  )
}





function mapPropertyType(
  value?: string
):
"apartment" |
"villa" |
"plot" |
"penthouse" |
"commercial" |
undefined {

  if (!value) return undefined


  const normalized =
    value
      .trim()
      .toLowerCase()



  if (
    normalized.includes("apartment") ||
    normalized.includes("flat") ||
    normalized.includes("independent floor")
  ){

    return "apartment"

  }



  if (
    normalized.includes("villa") ||
    normalized.includes("independent house") ||
    normalized.includes("bungalow")
  ){

    return "villa"

  }



  if(
    normalized.includes("penthouse")
  ){

    return "penthouse"

  }



  if(
    normalized.includes("plot") ||
    normalized.includes("land")
  ){

    return "plot"

  }



  if(
    normalized.includes("commercial") ||
    normalized.includes("office") ||
    normalized.includes("shop") ||
    normalized.includes("retail")
  ){

    return "commercial"

  }



  console.warn(
    `[Housing] Unknown property type: "${value}"`
  )


  return undefined

}







export async function syncHousingLeads()
:Promise<HousingSyncResult>{


  console.log(
    "1️⃣ Starting Housing sync"
  )



  console.log(
    "2️⃣ Fetching Housing leads..."
  )



  const leads =
    await fetchHousingLeads()



  console.log(
    `3️⃣ Found ${leads.length} leads`
  )



  let imported = 0

  let updated = 0

  let skipped = 0





  for(
    const lead of leads
  ){


    try {


      if(
        !lead.lead_phone
      ){

        skipped++

        continue

      }





      const phone =
        normalizePhone(
          `${lead.country_code}${lead.lead_phone}`
        )





      const existing =
        await contactsRepository.findByPhone(
          phone
        )





      const name =
        (
          lead.lead_name ?? ""
        )
        .trim()





      const parts =
        name.split(" ")





      const firstName =
        parts.shift() || "Unknown"





      const lastName =
        parts.length > 0
          ? parts.join(" ")
          : undefined





      const payload = {

        firstName,

        lastName,

        phone,

        email:
          lead.lead_email || undefined,


        city:
          lead.city_name,


        country:
          "India",


        leadSource:
          "housing",

        relationshipTypes:
          ["buyer"],


        housingLeadId:
          String(lead.flat_id),


        budgetMin:
          lead.min_price,


        budgetMax:
          lead.max_price,


        propertyType:
          mapPropertyType(
            lead.property_field?.[0]
          ),


        locations:
          lead.locality_name
            ? [lead.locality_name]
            : [],

      }





      let contact





      if(!existing){


        contact =
          await contactsRepository.create(
            payload
          )



        imported++



      }
      else {

        if(!needsHousingEnrichment(existing, payload)){

          skipped++

          continue

        }


        contact =
          await contactsRepository.update(
            existing.id,
            payload
          )



        updated++


      }



      







      await recordHousingActivity({
        contactId: contact.id,
        type: existing ? "note" : "contact_created",
        title: existing
          ? "Updated enquiry from Housing.com"
          : "New enquiry from Housing.com",
        description: `Housing lead interested in ${
          lead.property_field?.[0] ?? "property"
        } in ${
          lead.locality_name ?? "Goa"
        }.`,
      })


    }
    catch(error){


      skipped++


      console.error(
        "Housing Sync Error:",
        error
      )


    }

  }





  return {

    imported,

    updated,

    skipped,

  }

}
