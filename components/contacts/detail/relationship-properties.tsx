"use client"

import {
useEffect,
useState,
} from "react"

import type {
Contact,
} from "@/types/contact"

import type {
Property,
} from "@/types/property"


import {
getProperties,
} from "@/lib/repositories/property-repository"


import {
getPropertySharesByContactId,
} from "@/lib/repositories/property-share-repository"


import {
getPropertyMatches,
} from "@/lib/services/property-matching"


import {
RecommendedPropertyCard,
} from "./recommended-property-card"


import {
Card,
CardContent,
CardHeader,
CardTitle,
} from "@/components/ui/card"


import {
Badge,
} from "@/components/ui/badge"



type Props = {

contact: Contact

}



export function RelationshipProperties({
contact,
}:Props){


const [
sharedProperties,
setSharedProperties,
] =
useState<Property[]>([])



const [
sharedData,
setSharedData,
] =
useState<any[]>([])



const [
recommendedProperties,
setRecommendedProperties,
] =
useState<Property[]>([])



const [
loading,
setLoading,
] =
useState(true)



useEffect(()=>{


async function load(){


try{


const [

properties,

propertyShares,

] =
await Promise.all([

getProperties(),

getPropertySharesByContactId(
contact.id
),

])



const sharedIds =
new Set(
propertyShares.map(
item =>
item.propertyId
)
)



const shared =
properties.filter(
property =>
sharedIds.has(
property.id
)
)



const recommended =
getPropertyMatches(
contact,
properties
)
.map(
item =>
item.property
)
.filter(
property =>
!sharedIds.has(
property.id
)
)



setSharedProperties(
shared
)


setSharedData(
propertyShares
)


setRecommendedProperties(
recommended.slice(
0,
5
)
)



}
catch(error){

console.error(
"Loading contact properties failed",
error
)


}
finally{

setLoading(false)

}


}


load()


},[
contact
])



return (

<div className="space-y-6">


<Card className="rounded-2xl">


<CardHeader
className="px-4 py-3"
>

<CardTitle
className="flex items-center justify-between text-base"
>

<span>
Shared Properties
</span>


<Badge variant="secondary">

{sharedProperties.length}

</Badge>


</CardTitle>

</CardHeader>



<CardContent className="space-y-3 px-4 pb-5">


{
loading ?

(

<p className="text-sm text-muted-foreground">
Loading properties...
</p>

)

:

sharedProperties.length === 0

?

(

<p className="text-sm text-muted-foreground">
No properties shared yet.
</p>

)

:

sharedProperties.map(
property => {


const share =
sharedData.find(
item =>
item.propertyId === property.id
)


return (

<RecommendedPropertyCard

key={
property.id
}

property={
property
}

label="shared"

status={
share?.status
}

sharedAt={
share?.sharedAt
}

shareId={
share?.id
}

contactId={
contact.id
}

/>

)

}

)

}


</CardContent>

</Card>






<Card className="rounded-2xl">


<CardHeader
className="px-4 py-3"
>

<CardTitle
className="flex items-center justify-between text-base"
>

<span>
Recommended Matches
</span>


<Badge variant="secondary">

{recommendedProperties.length}

</Badge>


</CardTitle>

</CardHeader>



<CardContent className="space-y-3 px-4 pb-5">


{
recommendedProperties.length === 0

?

(

<p className="text-sm text-muted-foreground">
No matching properties found.
</p>

)

:

recommendedProperties.map(
property => (

<RecommendedPropertyCard

key={
property.id
}

property={
property
}

label="recommended"

/>

)

)

}


</CardContent>

</Card>


</div>

)

}