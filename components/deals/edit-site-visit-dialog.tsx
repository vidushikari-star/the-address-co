"use client"

import {
useState,
} from "react"

import {
Button,
} from "@/components/ui/button"

import {
updateSiteVisit,
} from "@/lib/repositories/site-visit-repository"

import type {
SiteVisit,
} from "@/types/site-visit"



type Props = {

visit: SiteVisit

open:boolean

onOpenChange:(open:boolean)=>void

onUpdated?:()=>void

}



export function EditSiteVisitDialog({
visit,
open,
onOpenChange,
onUpdated,
}:Props){


const [
saving,
setSaving,
]=useState(false)



const [
date,
setDate,
]=useState(
visit.scheduledDate
)



const [
time,
setTime,
]=useState(
visit.scheduledTime
)



const [
notes,
setNotes,
]=useState(
visit.notes ?? ""
)



async function save(){


setSaving(true)


try{


await updateSiteVisit(
visit.id,
{
scheduledDate:date,
scheduledTime:time,
notes,
}
)


onOpenChange(false)

onUpdated?.()


}
finally{

setSaving(false)

}

}



if(!open){
return null
}



return (

<div className="
fixed
inset-0
z-50
flex
items-center
justify-center
bg-black/40
">


<div className="
w-full
max-w-md
rounded-2xl
bg-background
p-6
space-y-4
">


<h2 className="text-lg font-semibold">
Edit Site Visit
</h2>


<input

className="w-full rounded-lg border p-2"

type="date"

value={date}

onChange={
e=>setDate(e.target.value)
}

/>


<input

className="w-full rounded-lg border p-2"

type="time"

value={time}

onChange={
e=>setTime(e.target.value)
}

/>


<textarea

className="w-full rounded-lg border p-2"

value={notes}

onChange={
e=>setNotes(e.target.value)
}

/>



<div className="
flex
justify-end
gap-2
">


<Button

variant="outline"

onClick={()=>
onOpenChange(false)
}

>

Cancel

</Button>



<Button

disabled={saving}

onClick={save}

>

{
saving
?
"Saving..."
:
"Save"
}

</Button>


</div>


</div>


</div>

)

}