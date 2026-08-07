import {
createServerSupabaseClient,
} from "@/lib/supabase/server"



export async function getConversionReport(){

const supabase =
await createServerSupabaseClient()



const {
data,
error,
} =
await supabase
.from("deals")
.select(
`
stage
`
)



if(error){

throw error

}



const deals =
data ?? []



const stages =
deals.reduce(
(acc,deal)=>{

const key =
deal.stage ?? "unknown"

acc[key] =
(acc[key] ?? 0) + 1


return acc

},
{} as Record<string,number>
)



const total =
deals.length



const won =
stages["closed_won"] ?? 0



const lost =
stages["closed_lost"] ?? 0



return {

total,

won,

lost,

conversionRate:
total === 0
? 0
:
Math.round(
(won / total) * 100
),

stages,

}

}