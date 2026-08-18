import {
  notFound,
} from "next/navigation"


import {
  getServerCalendarEvent,
  getServerCalendarUsers,
} from "@/lib/repositories/calendar-event-server-repository"


import {
  CalendarEventDetail,
} from "@/components/calendar/calendar-event-detail"



export const dynamic = "force-dynamic"





type Props = {

  params: Promise<{
    id:string
  }>

}







export default async function CalendarEventPage({
  params,
}:Props){


  const {
    id,
  } =
  await params





  const event =
    await getServerCalendarEvent(
      id
    )





  if(!event){

    notFound()

  }





  const users =
    await getServerCalendarUsers()





  const assignedUser =
    users.find(
      user =>
        user.id === event.assignedTo
    )





  const createdUser =
    users.find(
      user =>
        user.id === event.createdBy
    )





  return (

    <div className="
      p-4
      md:p-8
    ">


      <CalendarEventDetail

        event={
          event
        }

        assignedUser={
          assignedUser?.name
          ?? (
            event.assignedTo
            ? "Unknown advisor"
            : undefined
          )
        }

        createdUser={
          createdUser?.name
          ?? (
            event.createdBy
            ? "Unknown user"
            : "System"
          )
        }

      />


    </div>

  )

}
