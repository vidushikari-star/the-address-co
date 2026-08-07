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
lead_source
`
),


supabase
.from("deals")
.select(
`
contact_id,
stage,
closing_price
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
contactsResult.data ?? []


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



deals.forEach(
deal=>{

const contact =
contacts.find(
item =>
item.id === deal.contact_id
)


const source =
contact?.lead_source ?? "unknown"



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
deal.closing_price ?? 0
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