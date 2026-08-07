import Link from "next/link"

import {
ReportCard,
} from "@/components/reports/report-card"



type Props = {

totalProperties:number

availableProperties:number

propertiesWithVisits:number

inventory: {
id:string
name:string
location:string
type:string
status:string
shares:number
siteVisits:number
deals:number
}[]

}



export function InventoryReport({

totalProperties,

availableProperties,

propertiesWithVisits,

inventory,

}:Props){

const topProperties =
inventory
.slice()
.sort(
(a,b)=>
b.shares - a.shares
)
.slice(0,5)



return (

<section className="
space-y-6
">


<div className="
flex
flex-col
gap-3
sm:flex-row
sm:items-start
sm:justify-between
">


<div>

<h2 className="
text-xl
font-semibold
">

Inventory Performance

</h2>


<p className="
mt-1
text-sm
text-muted-foreground
">

Property activity and listing performance overview.

</p>


</div>



<Link

href="/api/reports/inventory/export"

className="
inline-flex
w-full
items-center
justify-center
rounded-lg
border
px-4
py-2
text-sm
font-medium
transition-colors
hover:bg-muted
sm:w-auto
"

>

Download Excel

</Link>


</div>





<div className="
grid
gap-4
sm:grid-cols-3
">


<ReportCard

title="Total Properties"

value={
totalProperties.toString()
}

/>



<ReportCard

title="Available Inventory"

value={
availableProperties.toString()
}

/>



<ReportCard

title="Properties With Visits"

value={
propertiesWithVisits.toString()
}

/>


</div>





<div className="
rounded-2xl
border
p-6
">


<h3 className="
mb-4
font-semibold
">

Most Engaged Properties

</h3>



<div className="
space-y-3
">


{
topProperties.map(
property => (

<div

key={
property.id
}

className="
flex
items-center
justify-between
rounded-xl
border
px-4
py-3
"

>

<div>

<p className="
font-medium
">

{property.name}

</p>


<p className="
text-sm
text-muted-foreground
">

{property.location}

</p>


</div>



<div className="
text-right
text-sm
">

<p>
{property.shares} shares
</p>


<p className="
text-muted-foreground
">

{property.siteVisits} visits

</p>


</div>


</div>

)

)

}



{
topProperties.length === 0 && (

<p className="
text-sm
text-muted-foreground
">

No inventory activity yet.

</p>

)

}


</div>


</div>


</section>

)

}