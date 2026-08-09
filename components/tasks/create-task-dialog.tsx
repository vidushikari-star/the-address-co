"use client"

import {
useState,
useEffect,
} from "react"

import {
useRouter,
} from "next/navigation"

import {
Plus,
X,
} from "lucide-react"

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
createTask,
} from "@/lib/repositories/task-repository"

import {
getAllUserProfiles,
} from "@/lib/repositories/user-profile-repository"

import type {
TaskPriority,
} from "@/types/task"

import type {
UserProfile,
} from "@/types/user"



type Props = {

contactId?: string

dealId?: string

onCreated?: () => void

}



export function CreateTaskDialog({
contactId,
dealId,
onCreated,
}: Props){


const router =
useRouter()



const [
open,
setOpen,
] =
useState(false)



const [
saving,
setSaving,
] =
useState(false)



const [
advisors,
setAdvisors,
] =
useState<UserProfile[]>([])



const [
form,
setForm,
] =
useState<{

title:string

description:string

priority:TaskPriority

dueDate:string

assignedTo:string

}>({

title:"",

description:"",

priority:"medium",

dueDate:"",

assignedTo:"",

})




useEffect(()=>{

async function loadAdvisors(){

const users =
await getAllUserProfiles()

setAdvisors(
users
)

}


if(open){

loadAdvisors()

}

},[
open
])




async function submit(){


if(
!form.title
){

return

}


setSaving(true)


try{


await createTask({

title:
form.title,


description:
form.description,


priority:
form.priority,


dueDate:
form.dueDate
?
new Date(form.dueDate)
:
undefined,


assignedTo:
form.assignedTo || undefined,


contactId,

dealId,

})



setOpen(false)



setForm({

title:"",

description:"",

priority:"medium",

dueDate:"",

assignedTo:"",

})



onCreated?.()

router.refresh()



}
finally{

setSaving(false)

}


}




return (

<>


<Button

className="
w-full
sm:w-auto
"

onClick={()=>
setOpen(true)
}

>

<Plus className="mr-2 h-4 w-4"/>

New Task

</Button>




{
open && (

<div className="
fixed
inset-0
z-50
flex
items-end
justify-center
bg-black/40
sm:items-center
">


<div className="
w-full
rounded-t-3xl
bg-background
p-5
sm:max-w-lg
sm:rounded-2xl
">


<div className="
mb-5
flex
items-center
justify-between
">


<h2 className="
text-lg
font-semibold
">

Create Task

</h2>


<Button

variant="ghost"

size="icon"

onClick={()=>
setOpen(false)
}

>

<X />

</Button>


</div>





<div className="
space-y-4
">


<Input

placeholder="Task title"

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

placeholder="Description"

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
text-sm
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

Select Advisor

</option>


{
  advisors.map(
    advisor => (

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





<Button

className="
w-full
"

disabled={
saving
}

onClick={
submit
}

>

{
saving
?
"Creating..."
:
"Create Task"
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