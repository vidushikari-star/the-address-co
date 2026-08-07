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
request:Request
){


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


const deals =
await getDeals()



const rows =
deals.map(
deal=>({

Deal:
deal.name ?? "-",


Stage:
deal.stage ?? "-",


Advisor:
deal.advisor ?? "-",


PropertyValue:
deal.value.propertyPrice ?? 0,


Probability:
`${deal.probability ?? 0}%`,


ExpectedClose:
deal.expectedCloseDate ?? "-",


CreatedDate:
deal.createdAt ?? "-",


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
"Conversion Funnel"
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
'attachment; filename="The_Address_Co_Conversion_Funnel.xlsx"',


},
}
)



}
catch(error){

console.error(error)


return NextResponse.json(
{
error:
"Failed to generate conversion report.",
},
{
status:500,
}
)

}


}