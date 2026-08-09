import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"

import {
  getAllUserProfiles,
} from "@/lib/repositories/user-profile-repository"

import {
  getCompanySettings,
} from "@/lib/repositories/company-settings-repository"



async function getTable(
  table:string
): Promise<Record<string, unknown>[]>{

const supabase =
await createServerSupabaseClient()


const {
data,
error,
} =
await supabase
.from(table)
.select("*")


if(error){

console.error(
`Backup failed for ${table}`,
error
)

throw error

}


return (data ?? []) as Record<string, unknown>[]

}



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



try {


const [
contacts,
properties,
deals,
tasks,
activities,
calendarEvents,
siteVisits,
notes,
propertyDocuments,
propertyImages,
propertyContacts,
propertyCommissions,
propertyShares,
commissions,
commissionDistributions,
expenses,
users,
settings,
] =
await Promise.all([


getTable("contacts"),

getTable("properties"),

getTable("deals"),

getTable("tasks"),

getTable("activities"),

getTable("calendar_events"),

getTable("site_visits"),

getTable("notes"),

getTable("property_documents"),

getTable("property_images"),

getTable("property_contacts"),

getTable("property_commissions"),

getTable("property_shares"),

getTable("commissions"),

getTable("commission_distributions"),

getTable("expenses"),

getAllUserProfiles(),

getCompanySettings(),


])



const workbook =
XLSX.utils.book_new()



function addSheet<Row extends object>(
name:string,
rows:Row[]
){

const sheet =
XLSX.utils.json_to_sheet(
rows
)


XLSX.utils.book_append_sheet(
workbook,
sheet,
name
)

}



addSheet(
"Contacts",
contacts
)


addSheet(
"Properties",
properties
)


addSheet(
"Deals",
deals
)


addSheet(
"Tasks",
tasks
)


addSheet(
"Activities",
activities
)


addSheet(
"Calendar Events",
calendarEvents
)


addSheet(
"Site Visits",
siteVisits
)


addSheet(
"Notes",
notes
)


addSheet(
"Property Documents",
propertyDocuments
)


addSheet(
"Property Images",
propertyImages
)


addSheet(
"Property Contacts",
propertyContacts
)


addSheet(
"Property Commissions",
propertyCommissions
)


addSheet(
"Property Shares",
propertyShares
)


addSheet(
"Commissions",
commissions
)


addSheet(
"Commission Splits",
commissionDistributions
)


addSheet(
"Expenses",
expenses
)


addSheet(
"Users",
users
)


addSheet(
"Settings",
Object.entries(settings).map(
([
key,
value,
])=>({

Key:key,

Value:value,

})
)
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
'attachment; filename="The_Address_Co_Full_Backup.xlsx"',


},
}
)


}
catch(error){

console.error(
"Backup export failed",
error
)


return NextResponse.json(
{
error:
"Failed to export CRM backup.",
},
{
status:500,
}
)

}


}
