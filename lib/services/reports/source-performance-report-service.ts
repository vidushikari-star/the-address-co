import {
createServerSupabaseClient,
} from "@/lib/supabase/server"



export async function getSourcePerformanceReport(){

const supabase =
await createServerSupabaseClient()



const [
contactsResult,
dealsResult,
] =
await Promise.all([


supabase
.from("contacts")
.select(
`
id,
lead_source,
relationship_types
`
),


supabase
.from("deals")
.select(
`
contact_id,
stage,
closing_price,
property_price
`
),

])



if(contactsResult.error){

throw contactsResult.error

}


if(dealsResult.error){

throw dealsResult.error

}



const contacts =
(contactsResult.data ?? []).filter(
contact =>
  contact.relationship_types?.includes("buyer")
)


const deals =
dealsResult.data ?? []



const sourceMap =
new Map()



contacts.forEach(
contact=>{

const source =
contact.lead_source ?? "unknown"


if(!sourceMap.has(source)){

sourceMap.set(
source,
{
source,
leads:0,
deals:0,
wonDeals:0,
revenue:0,
}
)

}


sourceMap.get(source).leads++

}

)



const contactsById =
new Map(
contacts.map(
contact => [
contact.id,
contact,
]
)
)


deals.forEach(
deal=>{

const contact =
contactsById.get(
deal.contact_id
)

if(!contact){

return

}


const source =
contact.lead_source ?? "unknown"



if(!sourceMap.has(source)){

sourceMap.set(
source,
{
source,
leads:0,
deals:0,
wonDeals:0,
revenue:0,
}
)

}



const row =
sourceMap.get(source)


row.deals++



if(
deal.stage === "closed_won"
){

row.wonDeals++

row.revenue +=
Number(
deal.closing_price ??
deal.property_price ??
0
)

}


}

)



return {

sources:
Array.from(
sourceMap.values()
),

}

}
