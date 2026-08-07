import Link from "next/link"

import {
ReportCard,
} from "@/components/reports/report-card"



type Props = {

totalBuyers:number

propertyTypes:Record<string,number>

locations:Record<string,number>

bedrooms:Record<string,number>

}



function formatLabel(
value:string
){

return value
.replaceAll("_"," ")
.replace(
  /\b\w/g,
  char =>
    char.toUpperCase()
)

}



function List({
title,
data,
}:{
title:string
data:Record<string,number>
}){

return (

<div className="
rounded-2xl
border
p-6
">

<h3 className="
mb-4
font-semibold
">

{title}

</h3>


<div className="
space-y-3
">


{
Object.entries(data)
.sort(
(a,b)=>
b[1]-a[1]
)
.slice(0,5)
.map(
([key,value])=>(

<div

key={key}

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

<span className="
text-sm
font-medium
">

{formatLabel(key)}

</span>


<span className="
font-semibold
">

{value}

</span>


</div>

)

)

}


{
Object.keys(data).length === 0 && (

<p className="
text-sm
text-muted-foreground
">

No data available.

</p>

)

}


</div>

</div>

)

}



export function BuyerDemandReport({

totalBuyers,

propertyTypes,

locations,

bedrooms,

}:Props){


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

Buyer Demand Analytics

</h2>


<p className="
mt-1
text-sm
text-muted-foreground
">

Insights into buyer requirements, preferred locations and property demand.

</p>


</div>



<Link

href="/api/reports/buyer-demand/export"

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

title="Total Buyers"

value={
totalBuyers.toString()
}

description="Buyer requirements captured"

/>


<ReportCard

title="Property Types"

value={
Object.keys(propertyTypes).length.toString()
}

description="Different property preferences"

/>


<ReportCard

title="Locations"

value={
Object.keys(locations).length.toString()
}

description="Preferred locations"

/>


</div>





<div className="
grid
gap-6
xl:grid-cols-3
">


<List

title="Property Type Demand"

data={
propertyTypes
}

/>


<List

title="Location Demand"

data={
locations
}

/>


<List

title="Bedroom Demand"

data={
bedrooms
}

/>


</div>


</section>

)

}