import {
createServerSupabaseClient,
} from "@/lib/supabase/server"



export async function getInventoryReport(){

const supabase =
await createServerSupabaseClient()



const [
propertiesResult,
sharesResult,
visitsResult,
dealsResult,
] = await Promise.all([


supabase
.from("properties")
.select(
`
id,
name,
location,
property_type,
status
`
),



supabase
.from("property_shares")
.select(
`
property_id
`
),



supabase
.from("site_visits")
.select(
`
property_id
`
),



supabase
.from("deals")
.select(
`
property_id,
stage
`
),


])



if(propertiesResult.error){

throw propertiesResult.error

}


if(sharesResult.error){

throw sharesResult.error

}


if(visitsResult.error){

throw visitsResult.error

}


if(dealsResult.error){

throw dealsResult.error

}



const properties =
propertiesResult.data ?? []


const shares =
sharesResult.data ?? []


const visits =
visitsResult.data ?? []


const deals =
dealsResult.data ?? []





const inventory =
properties.map(
property => {


const propertyShares =
shares.filter(
share =>
share.property_id === property.id
).length



const propertyVisits =
visits.filter(
visit =>
visit.property_id === property.id
).length



const propertyDeals =
deals.filter(
deal =>
deal.property_id === property.id &&
deal.stage === "closed_won"
).length



return {

id:
property.id,

name:
property.name ?? "-",


location:
property.location ?? "-",


type:
property.property_type ?? "-",


status:
property.status ?? "-",


shares:
propertyShares,


siteVisits:
propertyVisits,


deals:
propertyDeals,

}


}
)



return {

totalProperties:
properties.length,


availableProperties:
properties.filter(
property =>
property.status === "available"
).length,


propertiesWithVisits:
inventory.filter(
property =>
property.siteVisits > 0
).length,


inventory,

}

}