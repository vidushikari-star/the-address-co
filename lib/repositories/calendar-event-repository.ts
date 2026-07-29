import {
  supabase,
} from "@/lib/supabase/client"


import type {
  CalendarEvent,
} from "@/types/calendar-event"





export const CalendarEventRepository = {



  async getAll():Promise<CalendarEvent[]> {


    const {
      data,
      error,
    } =
      await supabase
        .from("calendar_events")
        .select("*")
        .order(
          "start_time",
          {
            ascending:true,
          }
        )



    if(error){

      throw error

    }




    return (

      data ?? []

    ).map(
      row => ({

        id:
          row.id,

        title:
          row.title,

        description:
          row.description ?? undefined,


        eventType:
          row.event_type,


        startTime:
          row.start_time,


        endTime:
          row.end_time ?? undefined,


        assignedTo:
          row.assigned_to ?? undefined,


        createdBy:
          row.created_by,


        contactId:
          row.contact_id ?? undefined,


        propertyId:
          row.property_id ?? undefined,


        dealId:
          row.deal_id ?? undefined,


        status:
          row.status,


        createdAt:
          row.created_at,


        updatedAt:
          row.updated_at,

      })

    )


  },







  async create(
    event:Partial<CalendarEvent>
  ){


    const {
      data,
      error,
    } =
      await supabase
        .from("calendar_events")
        .insert({

          title:
            event.title,


          description:
            event.description,


          event_type:
            event.eventType,


          start_time:
            event.startTime,


          end_time:
            event.endTime,


          assigned_to:
            event.assignedTo,


          created_by:
            event.createdBy,


          contact_id:
            event.contactId,


          property_id:
            event.propertyId,


          deal_id:
            event.dealId,


          status:
            event.status ?? "scheduled",

        })
        .select()
        .single()



    if(error){

      throw error

    }



    return data


  },





  async delete(
    id:string
  ){


    const {
      error,
    } =
      await supabase
        .from("calendar_events")
        .delete()
        .eq(
          "id",
          id
        )



    if(error){

      throw error

    }


  },


}