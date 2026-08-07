import {
NextResponse,
} from "next/server"

import * as XLSX from "xlsx"

import {
getServerUserProfile,
} from "@/lib/auth/server-user-profile"

import {
getDeals,
} from "@/lib/repositories/deal-repository"



export async function GET(
request: Request
) {


const user =
await getServerUserProfile()



if(!user){

return NextResponse.json(
{
error:"Unauthorized",
},
{
status:401,
}
)

}



if(user.role !== "admin"){

return NextResponse.json(
{
error:"Forbidden",
},
{
status:403,
}
)

}




let deals

try {


deals =
await getDeals()


}
catch(error){


console.error(error)


return NextResponse.json(
{
error:
"Failed to generate pipeline report.",
},
{
status:500,
}
)


}




const summaryRows = [

{
Metric:
"Total Deals",

Value:
deals.length,
},


{
Metric:
"Active Deals",

Value:
deals.filter(
deal =>
![
"closed_won",
"closed_lost",
]
.includes(
deal.stage
)
).length,
},


{
Metric:
"Pipeline Value",

Value:
deals
.filter(
deal =>
![
"closed_won",
"closed_lost",
]
.includes(
deal.stage
)
)
.reduce(
(sum,deal)=>

sum +
Number(
deal.value.propertyPrice ?? 0
)

,0
),
},


{
Metric:
"Closed Won Value",

Value:
deals
.filter(
deal =>
deal.stage === "closed_won"
)
.reduce(
(sum,deal)=>

sum +
Number(
deal.value.propertyPrice ?? 0
)

,0
),
},

]





const stageMap =
deals.reduce(
(
acc,
deal
)=>{


if(!acc[deal.stage]){

acc[deal.stage] = {

Stage:
deal.stage,

Deals:
0,

Value:
0,

}

}


acc[deal.stage].Deals += 1


acc[deal.stage].Value +=
Number(
deal.value.propertyPrice ?? 0
)



return acc


},
{} as Record<
string,
{
Stage:string
Deals:number
Value:number
}
>

)




const stageRows =
Object.values(
stageMap
)




const workbook =
XLSX.utils.book_new()



const summarySheet =
XLSX.utils.json_to_sheet(
summaryRows
)


XLSX.utils.book_append_sheet(
workbook,
summarySheet,
"Pipeline Summary"
)



const stageSheet =
XLSX.utils.json_to_sheet(
stageRows
)


XLSX.utils.book_append_sheet(
workbook,
stageSheet,
"Stage Breakdown"
)




const buffer =
XLSX.write(
workbook,
{
type:"buffer",
bookType:"xlsx",
}
)




return new NextResponse(
buffer,
{
headers:{

"Content-Type":
"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",


"Content-Disposition":
'attachment; filename="The_Address_Co_Pipeline.xlsx"',


},
}
)


}