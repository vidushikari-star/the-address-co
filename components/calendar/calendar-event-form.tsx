"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  useRouter,
  useSearchParams,
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
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/lib/repositories/calendar-event-repository"

import {
  createSiteVisitWithActivity,
} from "@/lib/services/site-visit-workflow"

import type {
  UserProfile,
} from "@/types/user"

import type {
  CalendarEvent,
  CalendarEventType,
} from "@/types/calendar-event"

import {
  ContactsRepository,
} from "@/lib/supabase/repositories/contacts.repository"

import {
  getProperties,
} from "@/lib/repositories/property-repository"

import {
  getDeals,
} from "@/lib/repositories/deal-repository"

import {
  getCurrentUser,
} from "@/lib/auth/current-user"

import type {
  Contact,
} from "@/types/contact"

import type {
  Property,
} from "@/types/property"

import type {
  Deal,
} from "@/types/deal"





type Props = {

  mode?: "create" | "edit"

  event?: CalendarEvent

}





function formatIndiaDateTime(
  dateString:string
){

  const date =
    new Date(dateString)


  return {

    date:
      new Intl.DateTimeFormat(
        "en-CA",
        {
          timeZone:"Asia/Kolkata",
        }
      ).format(date),


    time:
      new Intl.DateTimeFormat(
        "en-GB",
        {
          timeZone:"Asia/Kolkata",
          hour:"2-digit",
          minute:"2-digit",
          hour12:false,
        }
      ).format(date),

  }

}







export function CalendarEventForm({
  mode = "create",
  event,
}:Props){

  


  const router =
    useRouter()


  const searchParams =
    useSearchParams()





  const [
    users,
    setUsers,
  ] =
  useState<UserProfile[]>([])



  const [
    contacts,
    setContacts,
  ] =
  useState<Contact[]>([])



  const [
    properties,
    setProperties,
  ] =
  useState<Property[]>([])



  const [
    deals,
    setDeals,
  ] =
  useState<Deal[]>([])



  const [
    saving,
    setSaving,
  ] =
  useState(false)

  const [
    error,
    setError,
  ] =
  useState<string | null>(null)





  const [
    form,
    setForm,
  ] =
  useState({

    title:"",

    description:"",

    eventType:
      "meeting" as CalendarEventType,

    date:"",

    time:"",

    assignedTo:"",

    contactId:"",

    propertyId:"",

    dealId:"",

  })

  const filteredDeals =
  deals.filter(
    deal => {

      const matchesContact =
        !form.contactId ||
        deal.contactId === form.contactId


      const matchesProperty =
        !form.propertyId ||
        deal.propertyId === form.propertyId


      return (
        matchesContact &&
        matchesProperty
      )

    }
  )








  useEffect(()=>{


    async function loadData(){


      const [
        usersData,
        contactsData,
        propertiesData,
        dealsData,
      ] =
      await Promise.all([

        getCalendarUsers(),

        ContactsRepository.getAll(),

        getProperties(),

        getDeals(),

      ])



      setUsers(
        usersData
      )


      setContacts(
        contactsData
      )


      setProperties(
        propertiesData
      )


      setDeals(
        dealsData
      )


    }


    loadData()


  },[])








  useEffect(()=>{


    if(
      mode !== "create"
    ){

      return

    }


    const selectedDate =
      searchParams.get(
        "date"
      )


    if(
      selectedDate
    ){

      setForm(
        current => ({

          ...current,

          date:
            selectedDate,

        })
      )

    }


  },[
    mode,
    searchParams,
  ])








  useEffect(()=>{


    if(
      mode === "edit" &&
      event
    ){


      const indiaDate =
        formatIndiaDateTime(
          event.startTime
        )



      setForm({

        title:
          event.title,

        description:
          event.description ?? "",


        eventType:
          event.eventType,


        date:
          indiaDate.date,


        time:
          indiaDate.time,


        assignedTo:
          event.assignedTo ?? "",


        contactId:
          event.contactId ?? "",


        propertyId:
          event.propertyId ?? "",


        dealId:
          event.dealId ?? "",


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

      setError("Add a title, date, and time before saving the event.")
      return

    }



    if(
      form.eventType === "site_visit"
      && (
        !form.contactId
        || !form.propertyId
        || !form.assignedTo
      )
    ){

      setError("Site visits require a contact, property, and assigned advisor.")
      return

    }



    setSaving(true)
    setError(null)



    try{


      const startTime =
        `${form.date}T${form.time}:00+05:30`



      const payload = {


        title:
          form.title,

        description:
          form.description.trim() || undefined,


        eventType:
          form.eventType,


        startTime,


        assignedTo:
          form.assignedTo ||
          undefined,


        contactId:
          form.contactId ||
          undefined,


        propertyId:
          form.propertyId ||
          undefined,


        dealId:
          form.dealId ||
          undefined,


      }



      const currentUser =
        await getCurrentUser()

      if(!currentUser){

        throw new Error("You need to be signed in to create an event.")

      }



      if(
        form.eventType === "site_visit"
      ){

        await createSiteVisitWithActivity({
          dealId:
            form.dealId || undefined,

          contactId:
            form.contactId,

          propertyId:
            form.propertyId,

          scheduledDate:
            form.date,

          scheduledTime:
            form.time,

          notes:
            form.description.trim() || undefined,

          advisorId:
            form.assignedTo,

          activityDescription:
            form.title,
        })



        if(
          mode === "edit"
          && event
        ){

          await deleteCalendarEvent(
            event.id
          )

        }

      }



      else if(
        mode === "edit" &&
        event
      ){


        await updateCalendarEvent(
          event.id,
          payload
        )


      }
      else{

        await createCalendarEvent({

          ...payload,


          createdBy:
            currentUser.id,

        })


      }



      router.refresh()


      router.push(
        "/calendar"
      )


    }
    catch(error){

      setError(
        error instanceof Error
          ? error.message
          : "Unable to save the event. Please try again."
      )

    }
    finally{

      setSaving(false)

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

          Schedule meetings, site visits and follow-ups.

        </p>

      </div>







      <div className="space-y-4">


        {/* TITLE */}

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

            required

          />

        </div>


        <div>

          <label className="text-sm">
            Notes
          </label>

          <textarea
            className="mt-1 min-h-24 w-full rounded-md border bg-background px-3 py-2"
            placeholder="Agenda, requirements, or next steps"
            value={form.description}
            onChange={
              event =>
                setForm({
                  ...form,
                  description: event.target.value,
                })
            }
          />

        </div>








        {/* TYPE */}

        <div>

          <label className="text-sm">
            Type
          </label>


          <select

            value={
              form.eventType
            }

            onChange={
              e =>
                setForm({
                  ...form,
                  eventType:
                    e.target.value as CalendarEventType,
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

            <option value="meeting">
              Meeting
            </option>

            <option value="site_visit">
              Site Visit
            </option>

            <option value="follow_up">
              Follow Up
            </option>

            <option value="task">
              Task
            </option>

            <option value="other">
              Other
            </option>

          </select>


        </div>









        {/* CONTACT */}

        <div>

          <label className="text-sm">
            Contact
          </label>


          <select

            value={
              form.contactId
            }

            onChange={
  e =>
    setForm({
      ...form,

      contactId:
        e.target.value,

      dealId:
        "",
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
              Select Contact
            </option>


            {
              contacts.map(
                contact => (

                  <option

                    key={
                      contact.id
                    }

                    value={
                      contact.id
                    }

                  >

                    {contact.name}

                  </option>

                )
              )
            }


          </select>


        </div>









        {/* PROPERTY */}

        <div>

          <label className="text-sm">
            Property
          </label>


          <select

            value={
              form.propertyId
            }

            onChange={
  e =>
    setForm({
      ...form,

      propertyId:
        e.target.value,

      dealId:
        "",
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
              Select Property
            </option>


            {
              properties.map(
                property => (

                  <option

                    key={
                      property.id
                    }

                    value={
                      property.id
                    }

                  >

                    {property.name}

                  </option>

                )
              )
            }


          </select>


        </div>









        {/* DEAL */}

        <div>

          <label className="text-sm">
            Deal
          </label>


          <select

            value={
              form.dealId
            }

            onChange={
              e =>
                setForm({
                  ...form,
                  dealId:
                    e.target.value,
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
              Select Deal
            </option>


            {
  filteredDeals.map(
    deal => (

                  <option

                    key={
                      deal.id
                    }

                    value={
                      deal.id
                    }

                  >

                    {deal.name}

                  </option>

                )
              )
            }


          </select>


        </div>









        {/* DATE + TIME */}

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

              required

              value={
                form.date
              }

              onChange={
                e =>
                  setForm({
                    ...form,
                    date:
                      e.target.value,
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

              required

              value={
                form.time
              }

              onChange={
                e =>
                  setForm({
                    ...form,
                    time:
                      e.target.value,
                  })
              }

            />

          </div>


        </div>









        {/* ASSIGN */}

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
                  assignedTo:
                    e.target.value,
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









        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button

          type="button"

          variant="outline"

          disabled={saving}

          onClick={() => router.back()}

        >

          Cancel

        </Button>

        <Button

          className="w-full sm:w-auto"

          disabled={
            saving
          }

          onClick={submit}

        >

          {
            saving
            ?
            "Saving..."
            :
            mode === "edit"
            ?
            "Save Changes"
            :
            "Create Event"
          }


        </Button>
        </div>


      </div>


    </div>

  )

}
