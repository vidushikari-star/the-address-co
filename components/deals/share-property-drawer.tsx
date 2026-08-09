"use client"

import {
useEffect,
useMemo,
useState,
} from "react"

import {
FormDrawer,
} from "@/components/forms/form-drawer"

import {
Button,
} from "@/components/ui/button"

import {
Input,
} from "@/components/ui/input"

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
generatePropertyShareMessage,
} from "@/lib/communications/property-message"

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

selectedContactIds?:string[]

}



export function SharePropertyDrawer({

open,

onOpenChange,

propertyId,

selectedContactIds = [],

}:Props){


const [
selectedRecipients,
setSelectedRecipients,
] =
useState<string[]>(
selectedContactIds
)



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
search,
setSearch,
] =
useState("")



const [
loading,
setLoading,
] =
useState(false)



useEffect(()=>{


async function load(){

const [
propertyData,
contactData,
userData,
]=
await Promise.all([

getPropertyById(propertyId),

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

setSelectedRecipients(
selectedContactIds
)

load()

}


},[
open,
propertyId,
selectedContactIds,
])




const filteredContacts =
useMemo(()=>{


const query =
search.toLowerCase().trim()



if(!query){

return contacts

}



return contacts.filter(
contact => {


return (

contact.name
?.toLowerCase()
.includes(query)

||

contact.phone
?.toLowerCase()
.includes(query)

||

contact.email
?.toLowerCase()
.includes(query)

)


}

)


},[
contacts,
search,
])





function toggleRecipient(
id:string
){

setSelectedRecipients(
current =>

current.includes(id)

?

current.filter(
item=>item!==id
)

:

[
...current,
id
]

)

}





async function share(){


if(
!property ||
selectedRecipients.length===0
){

return

}



setLoading(true)


try{


const propertyUrl =
property.slug
? `${window.location.origin}/share/${property.slug}${
currentUser?.id
? `?advisor=${currentUser.id}`
: ""
}`
: property.publicLink



for(
const contactId of selectedRecipients
){


const recipient =
contacts.find(
contact =>
contact.id===contactId
)



if(!recipient){

continue

}



const message =
generatePropertyShareMessage({

contactName:
recipient.name,

advisorName:
currentUser?.name,

property:{

name:
property.name,

location:
property.location,

publicLink:
propertyUrl,

},

})



await createPropertyShare({

contactId:
recipient.id,

propertyId:
property.id,

})



await createActivity({

type:
"property_shared",

title:
"Property Shared on WhatsApp",

description:
`${property.name} shared with ${recipient.name}`,

body:
message,

contactId:
recipient.id,

propertyId:
property.id,

date:
new Date().toISOString(),

})



const phone =
(
recipient.whatsapp ??
recipient.phone ??
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

open={open}

onOpenChange={onOpenChange}

title="Share Property"

description="Select the contacts who should receive the property details."

>


<div className="space-y-5">



<div>

<Input

placeholder="Search contacts by name, phone or email"

value={search}

onChange={
e =>
setSearch(
e.target.value
)
}

/>

</div>





<div className="
max-h-72
space-y-2
overflow-y-auto
">


{
filteredContacts.map(
contact => (


<label

key={
contact.id
}

className="
flex
cursor-pointer
items-center
gap-3
rounded-xl
border
p-3
"

>


<input

type="checkbox"

checked={
selectedRecipients.includes(
contact.id
)
}

onChange={()=>
toggleRecipient(
contact.id
)
}

/>


<div className="min-w-0">

<p className="
truncate
text-sm
font-medium
">

{contact.name}

</p>


<p className="
text-xs
text-muted-foreground
">

{contact.phone}

</p>


</div>


</label>


)

)

}


{
filteredContacts.length===0 && (

<p className="
py-6
text-center
text-sm
text-muted-foreground
">

No matching contacts found.

</p>

)

}


</div>





<div className="
rounded-xl
bg-muted
p-4
">

<p className="
font-medium
">

Selected Recipients

</p>


<p className="
text-sm
text-muted-foreground
">

{selectedRecipients.length} contacts will receive this property.

</p>


</div>





<Button

className="
h-11
w-full
"

disabled={
loading ||
selectedRecipients.length===0
}

onClick={
share
}

>


{
loading
?
"Opening WhatsApp..."
:
`Share on WhatsApp (${selectedRecipients.length})`
}


</Button>



</div>


</FormDrawer>

)

}
