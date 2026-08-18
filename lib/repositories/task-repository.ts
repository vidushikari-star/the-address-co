import {
  supabase,
} from "@/lib/supabase/client"

import {
  mapTaskRow,
} from "@/lib/mappers/task.mapper"

import type {
  Task,
} from "@/types/task"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

async function mapTasksWithAdvisorNames(rows: Record<string, unknown>[]): Promise<Task[]> {
  const advisorIds = [
    ...new Set(
      rows
        .map(row => row.assigned_to)
        .filter((id): id is string => typeof id === "string" && Boolean(id))
    ),
  ]
  const { data: advisors, error } = advisorIds.length
    ? await supabase.from("user_profiles").select("id,name").in("id", advisorIds)
    : { data: [], error: null }
  if (error) throw error
  const names = new Map((advisors ?? []).map(advisor => [advisor.id, advisor.name]))
  return rows.map(row => ({
    ...mapTaskRow(row as Parameters<typeof mapTaskRow>[0]),
    advisorName: typeof row.assigned_to === "string"
      ? names.get(row.assigned_to) ?? "Unknown advisor"
      : undefined,
  }))
}



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


  return mapTasksWithAdvisorNames(data ?? [])

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


  return mapTasksWithAdvisorNames(data ?? [])

}




export async function createTask(
task: Partial<Task> & {

contactId?:string

dealId?:string

}
):Promise<Task>{

  const {
    data: { user },
  } = await supabase.auth.getUser()


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
        ?? null,

      due_time:
        task.dueTime
        ?? null,


      assigned_to:
        task.assignedTo ?? null,

      created_by:
        user?.id ?? null,

    })
    .select()
    .single()



  if(error){

    throw error

  }


  const created = mapTaskRow(data)

  try {
    await createActivity({
      type: "task_created",
      title: "Task created",
      description: created.title,
      contactId: created.contactId,
      dealId: created.dealId,
      date: new Date().toISOString(),
    })
  } catch (activityError) {
    console.error("Task activity log failed", {
      action: "task_created",
      taskId: created.id,
      code: activityError instanceof Error ? activityError.name : "unknown",
    })
  }

  return created

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
      updates.dueDate ?? null

  }

  if(updates.dueTime !== undefined){

    payload.due_time =
      updates.dueTime ?? null

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


  const updated = mapTaskRow(data)

  if (updates.completed !== undefined) {
    try {
      await createActivity({
        type: updates.completed ? "task_completed" : "task_created",
        title: updates.completed ? "Task completed" : "Task reopened",
        description: updated.title,
        contactId: updated.contactId,
        dealId: updated.dealId,
        date: new Date().toISOString(),
      })
    } catch (activityError) {
      console.error("Task activity log failed", {
        action: updates.completed ? "task_completed" : "task_reopened",
        taskId: updated.id,
        code: activityError instanceof Error ? activityError.name : "unknown",
      })
    }
  }

  return updated

}
