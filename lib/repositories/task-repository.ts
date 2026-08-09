import {
  supabase,
} from "@/lib/supabase/client"

import {
  mapTaskRow,
} from "@/lib/mappers/task.mapper"

import type {
  Task,
} from "@/types/task"



export async function getTasksByContactId(
  contactId:string
):Promise<Task[]> {


  const {
    data,
    error,
  } =
  await supabase
    .from("tasks")
    .select("*")
    .eq(
      "contact_id",
      contactId
    )
    .order(
      "created_at",
      {
        ascending:false,
      }
    )


  if(error){

    throw error

  }


  return (
    data ?? []
  )
  .map(
    mapTaskRow
  )

}




export async function getTasksByDealId(
  dealId:string
):Promise<Task[]> {


  const {
    data,
    error,
  } =
  await supabase
    .from("tasks")
    .select("*")
    .eq(
      "deal_id",
      dealId
    )
    .order(
      "created_at",
      {
        ascending:false,
      }
    )


  if(error){

    throw error

  }


  return (
    data ?? []
  )
  .map(
    mapTaskRow
  )

}




export async function createTask(
task: Partial<Task> & {

contactId?:string

dealId?:string

}
):Promise<Task>{


  const {
    data,
    error,
  } =
  await supabase
    .from("tasks")
    .insert({

      contact_id:
        task.contactId ?? null,


      deal_id:
        task.dealId ?? null,


      title:
        task.title,


      description:
        task.description ?? null,


      priority:
        task.priority ?? "medium",


      status:
        task.completed
        ? "completed"
        : "pending",


      due_date:
        task.dueDate
        ?
        task.dueDate
          .toISOString()
          .split("T")[0]
        :
        null,


      assigned_to:
        task.assignedTo ?? null,

    })
    .select()
    .single()



  if(error){

    throw error

  }


  return mapTaskRow(
    data
  )

}





export async function updateTask(
id:string,
updates:Partial<Task>
):Promise<Task>{


  const {
    data,
    error,
  } =
  await supabase
    .from("tasks")
    .update({

      title:
        updates.title,


      description:
        updates.description,


      priority:
        updates.priority,


      status:
        updates.completed
        ? "completed"
        : "pending",


      archived:
        updates.completed
        ? true
        : updates.archived,


      due_date:
        updates.dueDate
        ?
        updates.dueDate
          .toISOString()
          .split("T")[0]
        :
        undefined,


      assigned_to:
        updates.assignedTo,


      updated_at:
        new Date()
          .toISOString(),

    })
    .eq(
      "id",
      id
    )
    .select()
    .single()



  if(error){

    throw error

  }


  return mapTaskRow(
    data
  )

}