type Props = {

totalContacts:number

hotLeads:number

activeProperties:number

activeDeals:number

pipelineValue:number

pendingFollowUps:number

}


function money(
value:number
){

return `₹${value.toLocaleString("en-IN")}`

}



function Card({

title,

value,

description,

}:{
title:string
value:string
description?:string
}){

return (

<div className="rounded-2xl border p-6">

<p className="text-sm text-muted-foreground">
{title}
</p>


<h3 className="mt-2 text-2xl font-semibold">
{value}
</h3>


{
description && (

<p className="mt-1 text-xs text-muted-foreground">
{description}
</p>

)
}

</div>

)

}



export function OverviewReport({

totalContacts,

hotLeads,

activeProperties,

activeDeals,

pipelineValue,

pendingFollowUps,

}:Props){

return (

<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">


<Card

title="Total Contacts"

value={
totalContacts.toString()
}

description="CRM database"

/>


<Card

title="Hot Leads"

value={
hotLeads.toString()
}

description="Qualified buyers"

/>


<Card

title="Active Properties"

value={
activeProperties.toString()
}

description="Available inventory"

/>


<Card

title="Active Deals"

value={
activeDeals.toString()
}

description="Sales pipeline"

/>


<Card

title="Pipeline Value"

value={
money(pipelineValue)
}

description="Weighted opportunity"

/>


<Card

title="Pending Follow Ups"

value={
pendingFollowUps.toString()
}

description="Needs attention"

/>


</div>

)

}