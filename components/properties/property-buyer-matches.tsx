"use client"

import {
  useState,
} from "react"

import {
  Users,
  MessageCircle,
} from "lucide-react"

import {
  Button,
} from "@/components/ui/button"

import {
  SharePropertyDrawer,
} from "@/components/deals/share-property-drawer"

import type {
  BuyerMatch,
} from "@/lib/services/buyer-matching"


type Props = {
  matches: BuyerMatch[]
  propertyId: string
}


export function PropertyBuyerMatches({
  matches,
  propertyId,
}: Props) {


const [
selectedBuyers,
setSelectedBuyers,
] =
useState<string[]>([])



const [
open,
setOpen,
] =
useState(false)



const [
showAll,
setShowAll,
] =
useState(false)



function toggleBuyer(
id:string
){

setSelectedBuyers(
current =>
current.includes(id)

?
current.filter(
item =>
item !== id
)

:
[
...current,
id
]

)

}



const visibleMatches =
showAll
?
matches
:
matches.slice(
0,
2
)



return (

<section className="rounded-3xl border bg-card p-6">


<div className="mb-5 flex items-center justify-between">


<div>

<h2 className="text-xl font-semibold">
Matched Buyers
</h2>


<p className="text-sm text-muted-foreground">
{matches.length} potential buyers matching this property
</p>


</div>



<div className="flex items-center gap-2 text-primary">

<Users className="h-5 w-5"/>

<span className="font-semibold">
{matches.length}
</span>

</div>


</div>



{
matches.length === 0

?

(

<p className="text-sm text-muted-foreground">
No matching buyers found.
</p>

)

:

(

<div className="space-y-3">


{
visibleMatches.map(
(match)=>(


<div

key={
match.contact.id
}

className="
rounded-xl
border
p-4
"

>


<div className="flex gap-3">


<input

type="checkbox"

className="mt-1"

checked={
selectedBuyers.includes(
match.contact.id
)
}

onChange={() =>
toggleBuyer(
match.contact.id
)
}

/>



<div className="flex-1">


<div className="flex items-start justify-between gap-3">


<div>

<p className="font-medium">
{match.contact.name}
</p>


<p className="text-sm text-muted-foreground">
{match.contact.phone}
</p>

</div>



<span className="
rounded-full
bg-primary/10
px-3
py-1
text-xs
font-medium
text-primary
">

{match.score}%

</span>


</div>



<div className="mt-3 flex flex-wrap gap-2">

{
match.reasons.map(
(reason)=>(

<span

key={
reason
}

className="
rounded-full
bg-muted
px-2
py-1
text-xs
"

>

{reason}

</span>

)
)
}


</div>


</div>


</div>


</div>


)

)

}



{
matches.length > 2 && (

<Button

variant="outline"

className="w-full"

onClick={() =>
setShowAll(
!showAll
)
}

>

{
showAll
? "Show Less"
: `View All ${matches.length} Buyers`
}


</Button>

)

}



<Button

className="mt-3 w-full"

disabled={
selectedBuyers.length === 0
}

onClick={() =>
setOpen(true)
}

>

<MessageCircle className="mr-2 h-4 w-4"/>

Share with {selectedBuyers.length} Buyers

</Button>


</div>

)

}



<SharePropertyDrawer

open={open}

onOpenChange={setOpen}

propertyId={propertyId}

selectedContactIds={
selectedBuyers
}

/>


</section>

)

}