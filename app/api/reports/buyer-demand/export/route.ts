import {
NextResponse,
} from "next/server"

import * as XLSX from "xlsx"

import {
getServerUserProfile,
} from "@/lib/auth/server-user-profile"

import {
createServerSupabaseClient,
} from "@/lib/supabase/server"



export async function GET(){

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



const supabase =
await createServerSupabaseClient()



try {


const {
data,
error,
} =
await supabase
.from("contacts")
.select(
`
full_name,
property_type,
bedrooms,
locations,
budget_min,
budget_max,
currency,
timeline,
relationship_types
`
)
.contains(
"relationship_types",
["buyer"]
)



if(error){

throw error

}



const rows =
(data ?? [])
.map(
buyer => ({

Buyer:
buyer.full_name ?? "-",


PropertyType:
buyer.property_type ?? "-",


Bedrooms:
buyer.bedrooms ?? "-",


Locations:
Array.isArray(
buyer.locations
)
?
buyer.locations.join(", ")
:
"-",


BudgetMin:
buyer.budget_min ?? "-",


BudgetMax:
buyer.budget_max ?? "-",


Currency:
buyer.currency ?? "-",


Timeline:
buyer.timeline ?? "-",


})
)



const workbook =
XLSX.utils.book_new()



const sheet =
XLSX.utils.json_to_sheet(
rows
)



XLSX.utils.book_append_sheet(
workbook,
sheet,
"Buyer Demand"
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
'attachment; filename="The_Address_Co_Buyer_Demand.xlsx"',


},
}
)



}
catch(error){

console.error(error)


return NextResponse.json(
{
error:
"Failed to generate buyer demand report.",
},
{
status:500,
}
)

}


}
