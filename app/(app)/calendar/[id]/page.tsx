import {
  notFound,
} from "next/navigation"


import {
  getCalendarEvent,
} from "@/lib/repositories/calendar-event-repository"


import {
  getAllUserProfiles,
} from "@/lib/repositories/user-profile-repository"


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
    await getCalendarEvent(
      id
    )





  if(!event){

    notFound()

  }





  const users =
    await getAllUserProfiles()





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
        }

        createdUser={
          createdUser?.name
        }

      />


    </div>

  )

}