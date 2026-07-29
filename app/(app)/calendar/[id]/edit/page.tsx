import {
  notFound,
} from "next/navigation"


import {
  getCalendarEvent,
} from "@/lib/repositories/calendar-event-repository"


import {
  CalendarEventForm,
} from "@/components/calendar/calendar-event-form"




export const dynamic = "force-dynamic"





type Props = {

  params:Promise<{
    id:string
  }>

}





export default async function EditCalendarEventPage({
  params,
}:Props){


  const {
    id,
  } =
  await params




  const event =
    await getCalendarEvent(
      id
    )





  if(!event){

    notFound()

  }





  return (

    <div className="
      p-4
      md:p-8
    ">


      <CalendarEventForm

        mode="edit"

        event={
          event
        }

      />


    </div>

  )

}