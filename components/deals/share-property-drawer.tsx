"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  FormDrawer,
} from "@/components/forms/form-drawer"

import {
  Button,
} from "@/components/ui/button"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
  getPropertyById,
} from "@/lib/repositories/property-repository"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import {
  createPropertyShare,
} from "@/lib/repositories/property-share-repository"

import {
  getCurrentUser,
} from "@/lib/auth/current-user"

import type {
  Contact,
} from "@/types/contact"

import type {
  Property,
} from "@/types/property"

import type {
  UserProfile,
} from "@/types/user"



type Props = {

  open:boolean

  onOpenChange:(open:boolean)=>void

  propertyId:string

  selectedContactIds:string[]

}



export function SharePropertyDrawer({

  open,

  onOpenChange,

  propertyId,

  selectedContactIds,

}:Props){


const [
property,
setProperty,
] =
useState<Property | null>(null)



const [
contacts,
setContacts,
] =
useState<Contact[]>([])



const [
currentUser,
setCurrentUser,
] =
useState<UserProfile | null>(null)



const [
loading,
setLoading,
] =
useState(false)



useEffect(() => {

async function load(){

const [
propertyData,
contactData,
userData,
] =
await Promise.all([

getPropertyById(
propertyId
),

ContactsRepository.getAll(),

getCurrentUser(),

])


setProperty(
propertyData ?? null
)

setContacts(
contactData
)

setCurrentUser(
userData
)

}


if(open){

load()

}

},[
open,
propertyId,
])



async function share(){

if(
!property ||
selectedContactIds.length === 0
){

return

}


setLoading(true)


try {


const propertyUrl =
`${window.location.origin}/share/${property.slug}?advisor=${currentUser?.id}`



for(
const contactId of selectedContactIds
){


const buyer =
contacts.find(
contact =>
contact.id === contactId
)



if(!buyer){

continue

}



const message =
`Hi ${buyer.name},

Sharing details of this luxury property:

🏠 ${property.name}

📍 Location:
${property.location || "-"}

💰 ${
property.transactionType === "Rental"
? "Monthly Rent"
: "Asking Price"
}

${
property.transactionType === "Rental"
? property.price.rent
? `₹${property.price.rent.toLocaleString("en-IN")}/month`
: "-"
: property.price.asking
? `₹${property.price.asking.toLocaleString("en-IN")}`
: "-"
}

Property Details:

• Type:
${property.propertyType || "-"}

• Bedrooms:
${property.specifications.bedrooms || "-"}

• Bathrooms:
${property.specifications.bathrooms || "-"}

• Plot:
${
property.specifications.plotArea
? `${property.specifications.plotArea} sqm`
: "-"
}

• Built-up:
${
property.specifications.builtUpArea
? `${property.specifications.builtUpArea} sqft`
: "-"
}

View complete property details:

${propertyUrl}

Please let me know if you would like more details.

Regards,

${currentUser?.name || "The Address Co."}
`



await createPropertyShare({

contactId:
buyer.id,

propertyId:
property.id,

})



await createActivity({

type:
"property_shared",

title:
"Property Shared on WhatsApp",

description:
`${property.name} shared with ${buyer.name}`,

body:
message,

contactId:
buyer.id,

propertyId:
property.id,

date:
new Date().toISOString(),

})



const phone =
(
buyer.whatsapp ??
buyer.phone ??
""
)
.replace(
 /\D/g,
 ""
)



if(phone){

window.open(

`https://wa.me/${phone}?text=${encodeURIComponent(message)}`,

"_blank"

)

}


}



onOpenChange(false)


}
catch(error){

console.error(
"Bulk sharing failed",
error
)


alert(
"Unable to share property"
)


}
finally{

setLoading(false)

}


}



return (

<FormDrawer

open={
open
}

onOpenChange={
onOpenChange
}

title="Share Property"

description="Send property details to selected buyers."

>


<div className="space-y-5 pb-2">


<div className="rounded-xl border bg-muted p-4">

<p className="text-sm font-medium">

Selected Buyers

</p>


<p className="mt-1 text-sm text-muted-foreground">

{
selectedContactIds.length
}

buyers will receive this property.

</p>

</div>



<Button

className="h-11 w-full"

disabled={
loading ||
selectedContactIds.length === 0
}

onClick={
share
}

>

{
loading
? "Opening WhatsApp..."
: "Share on WhatsApp"
}


</Button>


</div>


</FormDrawer>

)

}