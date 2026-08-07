"use client"

import {
useState,
} from "react"

import Link from "next/link"

import {
Clock,
Phone,
AlertCircle,
CalendarDays,
RotateCcw,
X,
} from "lucide-react"

import {
Card,
CardContent,
CardHeader,
CardTitle,
} from "@/components/ui/card"

import {
Badge,
} from "@/components/ui/badge"

import {
Button,
} from "@/components/ui/button"

import {
WhatsAppButton,
} from "@/components/communications/whatsapp-button"

import {
ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
createActivity,
} from "@/lib/repositories/activity-repository"

import type {
Contact,
} from "@/types/contact"



type Props = {

queue: {

overdue: Contact[]

today: Contact[]

upcoming: Contact[]

}

}



export function FollowUpQueue({
queue,
}: Props){

const [
updating,
setUpdating,
] =
useState(false)



async function logCall(
contact: Contact
){

await createActivity({

type:"call",

title:"Follow up call",

body:
`Follow up call with ${contact.name}`,

contactId:
contact.id,

date:
new Date().toISOString(),

})


window.location.reload()

}



async function dismissFollowUp(
contact: Contact
){

try {

setUpdating(true)


await ContactsRepository.update(
contact.id,
{

nextFollowUpAt:
null,

}
)



await createActivity({

type:"note",

title:"Follow up dismissed",

body:
`Follow up dismissed for ${contact.name}`,

contactId:
contact.id,

date:
new Date().toISOString(),

})



window.location.reload()


}
finally{

setUpdating(false)

}

}

async function reschedule(
contact: Contact,
days: number
){

try {

  setUpdating(true)


  const date =
    new Date()


  date.setDate(
    date.getDate() + days
  )


  date.setHours(
    10,
    0,
    0,
    0
  )



  await ContactsRepository.update(
    contact.id,
    {

      nextFollowUpAt:
        date.toISOString(),

    }
  )



  await createActivity({

    type:"note",

    title:"Follow up rescheduled",

    body:
      `Follow up moved to ${date.toLocaleDateString()}`,

    contactId:
      contact.id,

    date:
      new Date().toISOString(),

  })



  window.location.reload()


}
finally {

  setUpdating(false)

}

}

function ContactItem({
contact,
}: {
contact: Contact
}){

return (

<div className="
  rounded-xl
  border
  p-3
  space-y-3
">


<Link
href={`/contacts/${contact.id}`}
>

<p className="
  font-medium
">

{contact.name}

</p>


<p className="
  text-sm
  text-muted-foreground
">

{contact.phone}

</p>


</Link>



<div className="
  grid
  grid-cols-1
  gap-2
  sm:grid-cols-3
">


<div className="w-full">

<WhatsAppButton
contact={contact}
/>

</div>



<Button

size="sm"

variant="outline"

className="w-full"

onClick={() =>
logCall(contact)
}

>

<Phone className="
mr-2
h-4
w-4
"/>

Call

</Button>



<Button

size="sm"

variant="outline"

className="w-full"

disabled={updating}

onClick={() =>
reschedule(
contact,
1
)
}

>

<RotateCcw className="
mr-2
h-4
w-4
"/>

Tomorrow

</Button>


</div>




<div className="
grid
grid-cols-3
gap-2
">


<Button

size="sm"

variant="ghost"

disabled={updating}

onClick={() =>
reschedule(
contact,
3
)
}

>

+3 Days

</Button>



<Button

size="sm"

variant="ghost"

disabled={updating}

onClick={() =>
reschedule(
contact,
7
)
}

>

Next Week

</Button>



<Button

size="sm"

variant="ghost"

disabled={updating}

onClick={() =>
dismissFollowUp(contact)
}

>

<X className="
mr-2
h-4
h-4
"/>

Dismiss

</Button>


</div>


</div>

)

}

  function Section({
title,
icon,
contacts,
variant,
}: {
title:string
icon:React.ReactNode
contacts:Contact[]
variant?: "danger" | "normal"
}){


    return (

      <section>


        <div className="
  mb-3
  flex
  items-center
  justify-between
">


          <div className="
flex
items-center
gap-2
">

{icon}

<h3 className="font-medium">

{title}

</h3>

<Badge
variant={
variant === "danger"
? "destructive"
: "secondary"
}
>

{contacts.length}

</Badge>

</div>





        </div>





        <div className="space-y-3">


          {
            contacts
.slice(0,2)
              .map(contact => (

                <ContactItem

                  key={contact.id}

                  contact={contact}

                />

              ))
          }




          {
            contacts.length === 0 && (

              <p className="
                text-sm
                text-muted-foreground
              ">

                No follow ups.

              </p>

            )
          }


        </div>


      </section>

    )

  }







  return (

    <Card>


      <CardHeader>

        <div className="
ml-auto
">



</div>


        <CardTitle className="
  flex
  items-center
  justify-between
">

  <div className="
    flex
    items-center
    gap-2
  ">

    <Clock className="h-5 w-5"/>

    Follow Up Queue

  </div>


  <Link href="/contacts">

    <Button
      variant="outline"
      size="sm"
    >

      View All

    </Button>

  </Link>


</CardTitle>


      </CardHeader>






      <CardContent className="
        space-y-6
      ">



        <Section

          title="Overdue"

          contacts={
            queue.overdue
          }

          variant="danger"

          icon={

            <AlertCircle className="
              h-4
              w-4
              text-destructive
            "/>

          }

        />





        <Section

          title="Today"

          contacts={
            queue.today
          }

          icon={

            <CalendarDays className="
              h-4
              w-4
            "/>

          }

        />





        <Section

          title="Upcoming"

          contacts={
            queue.upcoming
          }

          icon={

            <CalendarDays className="
              h-4
              w-4
            "/>

          }

        />



      </CardContent>


    </Card>

  )

}