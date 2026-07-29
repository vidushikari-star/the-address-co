"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  Button,
} from "@/components/ui/button"

import {
  Input,
} from "@/components/ui/input"

import {
  getCalendarUsers,
  createCalendarEvent,
  updateCalendarEvent,
} from "@/lib/repositories/calendar-event-repository"

import type {
  UserProfile,
} from "@/types/user"

import type {
  CalendarEvent,
  CalendarEventType,
} from "@/types/calendar-event"





type Props = {

  mode?: "create" | "edit"

  event?: CalendarEvent

}





export function CalendarEventForm({
  mode = "create",
  event,
}:Props){


  const router =
    useRouter()



  const [
    users,
    setUsers,
  ] =
  useState<UserProfile[]>([])



  const [
    saving,
    setSaving,
  ] =
  useState(false)





  const [
  form,
  setForm,
] = useState<{
  title: string
  eventType: CalendarEventType
  date: string
  time: string
  assignedTo: string
}>({
  title: "",
  eventType: "meeting",
  date: "",
  time: "",
  assignedTo: "",
})







  useEffect(()=>{


    async function loadUsers(){

      const data =
        await getCalendarUsers()


      setUsers(
        data
      )


    }


    loadUsers()


  },[])







  useEffect(()=>{


    if(
      mode === "edit" &&
      event
    ){

      const date =
        new Date(
          event.startTime
        )


      setForm({

        title:
          event.title,


        eventType:
          event.eventType,


        date:
          `${date.getFullYear()}-${
            String(
              date.getMonth()+1
            ).padStart(
              2,
              "0"
            )
          }-${
            String(
              date.getDate()
            ).padStart(
              2,
              "0"
            )
          }`,


        time:
          `${String(
            date.getHours()
          ).padStart(
            2,
            "0"
          )}:${
            String(
              date.getMinutes()
            ).padStart(
              2,
              "0"
            )
          }`,


        assignedTo:
          event.assignedTo ?? "",

      })

    }


  },[
    mode,
    event,
  ])









  async function submit(){


    if(
      !form.title ||
      !form.date ||
      !form.time
    ){

      return

    }



    setSaving(
      true
    )



    try{


      const startTime =
        new Date(
          `${form.date}T${form.time}`
        )
        .toISOString()





      if(
        mode === "edit" &&
        event
      ){


        await updateCalendarEvent(

          event.id,

          {

            title:
              form.title,


            eventType:
              form.eventType,


            startTime,


            assignedTo:
              form.assignedTo ||
              undefined,

          }

        )


      }
      else{


        const currentUser =
          users[0]



        await createCalendarEvent({

          title:
            form.title,


          eventType:
            form.eventType,


          startTime,


          assignedTo:
            form.assignedTo ||
            undefined,


          createdBy:
            currentUser?.id,

        })


      }




      router.refresh()


      router.push(
        "/calendar"
      )


    }
    finally{

      setSaving(
        false
      )

    }


  }







  return (

    <div className="
      space-y-6
      rounded-2xl
      border
      bg-card
      p-5
      md:max-w-xl
    ">


      <div>

        <h2 className="
          text-xl
          font-semibold
        ">

          {
            mode === "edit"
            ? "Edit Event"
            : "New Event"
          }

        </h2>


        <p className="
          text-sm
          text-muted-foreground
        ">

          Shared team calendar event.

        </p>

      </div>







      <div className="space-y-4">


        <div>

          <label className="text-sm">
            Title
          </label>


          <Input

            value={
              form.title
            }

            onChange={
              e =>
                setForm({
                  ...form,
                  title:e.target.value,
                })
            }

            placeholder="Client meeting"

          />

        </div>







        <div>

          <label className="text-sm">
            Type
          </label>


          <select

            value={
              form.eventType
            }

            onChange={(e) => {
  const value = e.target.value

  if (
    value === "meeting" ||
    value === "site_visit" ||
    value === "follow_up" ||
    value === "task" ||
    value === "other"
  ) {
    setForm({
      ...form,
      eventType: value,
    })
  }
}}

            className="
              mt-1
              w-full
              rounded-md
              border
              bg-background
              px-3
              py-2
            "

          >

            <option value="meeting">
              Meeting
            </option>


            <option value="site_visit">
              Site Visit
            </option>


            <option value="follow_up">
              Follow Up
            </option>


            <option value="other">
              Other
            </option>

            <option value="task">
  Task
</option>


          </select>


        </div>







        <div className="
          grid
          grid-cols-2
          gap-3
        ">


          <div>

            <label className="text-sm">
              Date
            </label>


            <Input

              type="date"

              value={
                form.date
              }

              onChange={
                e =>
                  setForm({
                    ...form,
                    date:e.target.value,
                  })
              }

            />

          </div>





          <div>

            <label className="text-sm">
              Time
            </label>


            <Input

              type="time"

              value={
                form.time
              }

              onChange={
                e =>
                  setForm({
                    ...form,
                    time:e.target.value,
                  })
              }

            />

          </div>


        </div>








        <div>

          <label className="text-sm">
            Assign To
          </label>


          <select

            value={
              form.assignedTo
            }

            onChange={
              e =>
                setForm({
                  ...form,
                  assignedTo:e.target.value,
                })
            }


            className="
              mt-1
              w-full
              rounded-md
              border
              bg-background
              px-3
              py-2
            "

          >

            <option value="">
              Select user
            </option>


            {
              users.map(
                user => (

                  <option

                    key={
                      user.id
                    }

                    value={
                      user.id
                    }

                  >

                    {user.name}

                  </option>

                )
              )
            }


          </select>


        </div>







        <Button

          className="w-full"

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
            "Saving..."
            :
            mode === "edit"
            ? "Save Changes"
            : "Create Event"
          }


        </Button>


      </div>


    </div>

  )

}