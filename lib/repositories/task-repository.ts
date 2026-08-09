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


  const payload: Record<string, unknown> = {
    updated_at:
      new Date()
        .toISOString(),
  }

  if(updates.title !== undefined){

    payload.title =
      updates.title

  }

  if(updates.description !== undefined){

    payload.description =
      updates.description

  }

  if(updates.priority !== undefined){

    payload.priority =
      updates.priority

  }

  if(updates.completed !== undefined){

    payload.status =
      updates.completed
        ? "completed"
        : "pending"

    payload.archived =
      updates.completed

  }

  if(updates.archived !== undefined){

    payload.archived =
      updates.archived

  }

  if(updates.dueDate !== undefined){

    payload.due_date =
      updates.dueDate
        ? updates.dueDate
            .toISOString()
            .split("T")[0]
        : null

  }

  if(updates.assignedTo !== undefined){

    payload.assigned_to =
      updates.assignedTo

  }


  const {
    data,
    error,
  } =
    await supabase
      .from("tasks")
    .update(payload)
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
