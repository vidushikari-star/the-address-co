import {
createServerSupabaseClient,
} from "@/lib/supabase/server"



export async function getBuyerDemandReport(){

const supabase =
await createServerSupabaseClient()



const {
data,
error,
} =
await supabase
.from("contacts")
.select(
`
property_type,
bedrooms,
locations,
budget_min,
budget_max
`
)



if(error){

throw error

}



const contacts =
data ?? []



const propertyTypes =
contacts.reduce(
(acc,item)=>{

const key =
item.property_type ?? "unknown"

acc[key] =
(acc[key] ?? 0) + 1

return acc

},
{} as Record<string,number>
)



const locations =
contacts.reduce(
(acc,item)=>{

if(
Array.isArray(item.locations)
){

item.locations.forEach(
(location:string)=>{

acc[location] =
(acc[location] ?? 0) + 1

}
)

}

return acc

},
{} as Record<string,number>
)



const bedrooms =
contacts.reduce(
(acc,item)=>{

const key =
item.bedrooms ?? "unknown"

acc[key] =
(acc[key] ?? 0) + 1

return acc

},
{} as Record<string,number>
)



return {

totalBuyers:
contacts.length,

propertyTypes,

locations,

bedrooms,

}

}