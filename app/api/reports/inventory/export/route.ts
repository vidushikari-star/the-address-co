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



export async function GET() {


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


const [
propertiesResult,
sharesResult,
visitsResult,
dealsResult,
] =
await Promise.all([


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



if(propertiesResult.error)
throw propertiesResult.error


if(sharesResult.error)
throw sharesResult.error


if(visitsResult.error)
throw visitsResult.error


if(dealsResult.error)
throw dealsResult.error



const properties =
propertiesResult.data ?? []


const shares =
sharesResult.data ?? []


const visits =
visitsResult.data ?? []


const deals =
dealsResult.data ?? []



const rows =
properties.map(
property => ({


Property:
property.name ?? "-",


Location:
property.location ?? "-",


Type:
property.property_type ?? "-",


Status:
property.status ?? "-",


Shares:
shares.filter(
item =>
item.property_id === property.id
).length,


SiteVisits:
visits.filter(
item =>
item.property_id === property.id
).length,


ClosedDeals:
deals.filter(
item =>
item.property_id === property.id &&
item.stage === "closed_won"
).length,


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
"Inventory"
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
'attachment; filename="The_Address_Co_Inventory.xlsx"',


},
}
)



}
catch(error){


console.error(error)


return NextResponse.json(
{
error:
"Failed to generate inventory report.",
},
{
status:500,
}
)

}


}
