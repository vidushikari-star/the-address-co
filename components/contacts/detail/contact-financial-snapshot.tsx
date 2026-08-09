"use client"

import {
Card,
CardContent,
CardHeader,
CardTitle,
} from "@/components/ui/card"

import type {
ContactSummary,
} from "@/lib/repositories/contact-summary-repository"



function money(value:number){

return `₹${value.toLocaleString(
"en-IN"
)}`

}



export function ContactFinancialSnapshot({
summary,
linkedPropertyScope = false,
}:{
summary:ContactSummary
linkedPropertyScope?:boolean
}){


return (

<Card className="rounded-2xl">

<CardHeader>

<CardTitle className="text-base">

Financial Snapshot

</CardTitle>

</CardHeader>


<CardContent className="
grid
grid-cols-2
gap-4
text-sm
">


<div>

<p className="text-muted-foreground">
{
linkedPropertyScope
? "Linked Properties"
: "Properties"
}
</p>

<p className="font-semibold">
{summary.propertiesOwned}
</p>

</div>



<div>

<p className="text-muted-foreground">
Deals Closed
</p>

<p className="font-semibold">
{summary.closedDeals}
</p>

</div>




<div>

<p className="text-muted-foreground">
Total Deals
</p>

<p className="font-semibold">
{summary.dealsCount}
</p>

</div>




<div>

<p className="text-muted-foreground">
Commission
</p>

<p className="font-semibold">
{money(
summary.commissionGenerated
)}
</p>

</div>


</CardContent>

</Card>

)

}
