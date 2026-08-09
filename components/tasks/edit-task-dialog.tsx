"use client"

import {
useEffect,
useState,
} from "react"

import {
Button,
} from "@/components/ui/button"

import {
Input,
} from "@/components/ui/input"

import {
Textarea,
} from "@/components/ui/textarea"

import {
updateTask,
} from "@/lib/repositories/task-repository"

import {
getAllUserProfiles,
} from "@/lib/repositories/user-profile-repository"

import type {
TaskWithContext,
} from "@/lib/repositories/task-server-repository"

import type {
UserProfile,
} from "@/types/user"



type Props = {

task: TaskWithContext

onUpdated?: () => void

}



export function EditTaskDialog({
task,
onUpdated,
}:Props){


const [
open,
setOpen,
]=
useState(false)



const [
saving,
setSaving,
]=
useState(false)



const [
advisors,
setAdvisors,
]=
useState<UserProfile[]>([])



const [
form,
setForm,
]=
useState({

title:
task.title,

description:
task.description ?? "",

dueDate:
task.dueDate
?
new Date(task.dueDate)
.toISOString()
.split("T")[0]
:
"",

assignedTo:
task.assignedTo ?? "",

})



useEffect(()=>{

if(open){

getAllUserProfiles()
.then(
setAdvisors
)

}

},[
open
])



async function save(){


setSaving(true)


try{


await updateTask(
task.id,
{

title:
form.title,

dueDate:
form.dueDate
?
new Date(form.dueDate)
:
undefined,

assignedTo:
form.assignedTo || undefined,

completed:
task.completed,

}

)



setOpen(false)

onUpdated?.()


}
finally{

setSaving(false)

}


}



return (

<>


<Button

variant="outline"

size="sm"

onClick={()=>
setOpen(true)
}

>

Edit

</Button>




{
open && (

<div className="
fixed
inset-0
z-50
flex
items-center
justify-center
bg-black/40
p-4
">


<div className="
w-full
max-w-lg
rounded-2xl
bg-background
p-6
space-y-4
">


<h2 className="
text-lg
font-semibold
">

Edit Task

</h2>



<Input

value={
form.title
}

onChange={
e=>
setForm({
...form,
title:e.target.value
})
}

/>



<Textarea

value={
form.description
}

onChange={
e=>
setForm({
...form,
description:e.target.value
})
}

/>



<Input

type="date"

value={
form.dueDate
}

onChange={
e=>
setForm({
...form,
dueDate:e.target.value
})
}

/>




<div>

<label className="
mb-2
block
text-sm
font-medium
">

Assigned Advisor

</label>


<select

className="
w-full
rounded-xl
border
p-3
"

value={
form.assignedTo
}

onChange={
e=>
setForm({
...form,
assignedTo:e.target.value
})
}

>

<option value="">

Unassigned

</option>


{
advisors.map(
advisor=>(

<option

key={
advisor.id
}

value={
advisor.id
}

>

{advisor.name}

</option>

)

)

}


</select>


</div>





<div className="
flex
gap-3
">


<Button

variant="outline"

onClick={()=>
setOpen(false)
}

>

Cancel

</Button>



<Button

disabled={
saving
}

onClick={
save
}

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


</>

)

}