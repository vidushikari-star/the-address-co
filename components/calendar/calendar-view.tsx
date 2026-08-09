"use client"

import {
useEffect,
useState,
} from "react"

import {
ChevronLeft,
ChevronRight,
CalendarDays,
ListFilter,
} from "lucide-react"

import {
CalendarEvent,
} from "./calendar-event"

import {
EditSiteVisitDialog,
} from "@/components/deals/edit-site-visit-dialog"

import type {
CalendarItem,
} from "@/types/calendar"

import type {
SiteVisitStatus,
} from "@/types/site-visit"


type Props = {
items: CalendarItem[]
}


type FilterType =
| "all"
| "activity"
| "site_visit"
| "task"



function formatDateKey(
date: Date
){

return (
`${date.getFullYear()}-${
String(date.getMonth()+1)
.padStart(2,"0")
}-${
String(date.getDate())
.padStart(2,"0")
}`
)

}



function getIndiaDate(
date:string | Date
){

const value =
new Date(date)

return new Date(
value.toLocaleString(
"en-US",
{
timeZone:"Asia/Kolkata",
}
)
)

}



export function CalendarView({
items,
}:Props){


const [
currentMonth,
setCurrentMonth,
]=useState<Date | null>(null)



const [
filter,
setFilter,
]=useState<FilterType>("all")



const [
selectedSiteVisit,
setSelectedSiteVisit,
]=useState<CalendarItem | null>(null)



useEffect(()=>{

setCurrentMonth(
getIndiaDate(
new Date()
)
)

},[])



if(!currentMonth){

return null

}



const today =
getIndiaDate(
new Date()
)



const filteredItems =
items.filter(
item => {

if(
filter === "all"
){

return true

}


return item.type === filter

}

)



const year =
currentMonth.getFullYear()


const month =
currentMonth.getMonth()



const monthName =
currentMonth.toLocaleDateString(
"en-IN",
{
month:"long",
year:"numeric",
}
)



const grouped =
filteredItems
.filter(
item =>
item.type === "task" ||
item.type === "site_visit" ||
item.type === "activity"
)
.reduce(

(
acc,
item
)=>{


const eventDate =
getIndiaDate(
item.date
)


const key =
formatDateKey(
eventDate
)


if(!acc[key]){

acc[key]=[]

}


acc[key].push(
item
)


return acc

},

{} as Record<string,CalendarItem[]>

)



const upcoming =
filteredItems
.filter(
item =>
getIndiaDate(item.date) >= today
)
.slice(
0,
10
)



const firstDay =
new Date(
year,
month,
1
).getDay()



const daysInMonth =
new Date(
year,
month+1,
0
).getDate()



const cells =
Array.from({
length:firstDay + daysInMonth
})



function changeMonth(
amount:number
){

setCurrentMonth(
new Date(
year,
month + amount,
1
)
)

}



function handleSelect(
item:CalendarItem
){

if(
item.type === "site_visit"
){

setSelectedSiteVisit(
item
)

}

}



return (

<div className="space-y-8">


<div className="
flex
flex-wrap
items-center
gap-2
">


<div className="
flex
items-center
gap-2
text-sm
text-muted-foreground
mr-2
">

<ListFilter className="h-4 w-4"/>

Filter

</div>


{
[
{
key:"all",
label:"All",
},
{
key:"activity",
label:"Meetings",
},
{
key:"site_visit",
label:"Site Visits",
},
{
key:"task",
label:"Tasks",
},
]
.map(
option=>(

<button

key={option.key}

onClick={() =>
setFilter(
option.key as FilterType
)
}

className={`
rounded-full
border
px-4
py-2
text-sm
transition
${
filter===option.key
?
"bg-primary text-primary-foreground"
:
"hover:bg-muted"
}
`}

>

{option.label}

</button>

)
)

}

</div>





{/* MOBILE */}

<div className="
space-y-4
md:hidden
">


<div className="
flex
items-center
gap-2
">

<CalendarDays className="h-5 w-5"/>

<h2 className="text-lg font-semibold">
Upcoming
</h2>

</div>



{
upcoming.length === 0
?

<div className="
rounded-xl
border
p-6
text-center
text-muted-foreground
">

No upcoming events.

</div>

:

<div className="space-y-3">

{
upcoming.map(
item=>(

<CalendarEvent

key={item.id}

item={item}

mobile

onSelect={
handleSelect
}

/>

)
)

}

</div>

}


</div>





{/* DESKTOP */}

<div className="
hidden
space-y-6
md:block
">


<div className="
flex
items-center
justify-between
">


<button

onClick={() =>
changeMonth(-1)
}

className="
rounded-lg
border
p-2
"

>

<ChevronLeft/>

</button>



<h2 className="
text-2xl
font-semibold
capitalize
">

{monthName}

</h2>



<button

onClick={() =>
changeMonth(1)
}

className="
rounded-lg
border
p-2
"

>

<ChevronRight/>

</button>


</div>





<div className="
grid
grid-cols-7
gap-2
text-center
text-sm
text-muted-foreground
">

{
[
"Sun",
"Mon",
"Tue",
"Wed",
"Thu",
"Fri",
"Sat",
]
.map(
day=>(

<div key={day}>
{day}
</div>

)
)

}

</div>





<div className="
grid
grid-cols-7
gap-2
">


{
cells.map(
(_,index)=>{


if(index < firstDay){

return (

<div

key={index}

className="
min-h-32
rounded-xl
border
bg-muted/20
"

/>

)

}



const day =
index-firstDay+1



const date =
new Date(
year,
month,
day
)



const key =
formatDateKey(
date
)



return (

<div

key={index}

className="
min-h-32
rounded-xl
border
p-2
space-y-2
"

>


<div className="
text-sm
font-semibold
">

{day}

</div>



{
grouped[key]?.map(
item=>(

<CalendarEvent

key={item.id}

item={item}

onSelect={
handleSelect
}

/>

)
)

}


</div>

)

}

)

}

</div>


</div>





{
selectedSiteVisit && (

<EditSiteVisitDialog

visit={{
id:
selectedSiteVisit.id.replace(
"visit-",
""),

dealId:
selectedSiteVisit.dealId,

contactId:
selectedSiteVisit.contactId!,

propertyId:
selectedSiteVisit.propertyId!,

scheduledDate:
formatDateKey(
  getIndiaDate(
    selectedSiteVisit.date
  )
),

scheduledTime:
selectedSiteVisit.time ?? "",

status:
(
selectedSiteVisit.status ?? "scheduled"
) as SiteVisitStatus,

contactName:
selectedSiteVisit.contactName ?? "",

propertyName:
selectedSiteVisit.propertyName ?? "",

advisorName:
selectedSiteVisit.assignedTo ?? "",

buyerFeedback:
undefined,

notes:
undefined,

createdAt:
new Date().toISOString(),

updatedAt:
new Date().toISOString(),

}}


open={
true
}

onOpenChange={
(open)=>{

if(!open){

setSelectedSiteVisit(null)

}

}

}

/>

)

}


</div>

)

}
