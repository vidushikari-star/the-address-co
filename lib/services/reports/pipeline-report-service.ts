import {
createServerSupabaseClient,
} from "@/lib/supabase/server"



export async function getPipelineReport(){

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
id,
stage,
property_price,
probability,
closing_price
`
)



if(error){

throw error

}



const deals =
data ?? []



const activeDeals =
deals.filter(
deal =>
![
"closed_won",
"closed_lost",
].includes(
deal.stage
)
)



const pipelineValue =
activeDeals.reduce(
(total,deal)=>

total +
Number(
deal.property_price ?? 0
)

,0
)



const weightedPipeline =
activeDeals.reduce(
(total,deal)=>

total +
(
Number(
deal.property_price ?? 0
)
*
(
Number(
deal.probability ?? 0
)
/100
)
)

,0
)



const closedWonRevenue =
deals
.filter(
deal =>
deal.stage === "closed_won"
)
.reduce(
(total,deal)=>

total +
Number(
deal.closing_price ??
deal.property_price ??
0
)

,0
)



const stages =
deals.reduce(
(acc,deal)=>{

acc[deal.stage] =
(acc[deal.stage] ?? 0) + 1

return acc

},
{} as Record<string,number>
)



return {

totalDeals:
deals.length,

activeDeals:
activeDeals.length,

pipelineValue,

weightedPipeline,

closedWonRevenue,

stages,

}

}