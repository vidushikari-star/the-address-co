import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"

import {
  mapTaskRow,
} from "@/lib/mappers/task.mapper"

import type {
  Task,
} from "@/types/task"



export type TaskWithContext =
  Task & {

    contactId?: string

    dealId?: string

    contactName?: string

    dealName?: string

    propertyName?: string

  }





export async function getAllTasks(): Promise<TaskWithContext[]> {


  const supabase =
    await createServerSupabaseClient()



  const {
    data,
    error,
  } =
    await supabase
      .from("tasks")
      .select(`
        *,
        contact:contacts (
          full_name
        ),
        deal:deals (
          name
        )
      `)
      .order(
        "due_date",
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

    ...mapTaskRow(row),


    contactId:
      row.contact_id ?? undefined,


    dealId:
      row.deal_id ?? undefined,


    contactName:
      row.contact?.full_name ?? "",


    dealName:
      row.deal?.name ?? "",


    propertyName:
      "",


  })

)


}