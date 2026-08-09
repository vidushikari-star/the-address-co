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
  advisorName?: string
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
        contact:contacts(
          full_name
        ),
        deal:deals(
          name
        )
      `)
      .order(
        "due_date",
        {
          ascending:false,
        }
      )



  if(error){

    throw error

  }



  const rows =
    data ?? []



  const advisorIds = [
  ...new Set(
    (data ?? [])
      .map(
        row => row.assigned_to
      )
      .filter(
        Boolean
      )
  )
]


let advisors:{
  id:string
  name:string
}[] = []


const possibleIds =
advisorIds.filter(
  value =>
    value.includes("-")
)



if(possibleIds.length){


const {
data: advisorData,
error: advisorError,
} =
await supabase
.from("user_profiles")
.select(
"id,name"
)
.in(
"id",
possibleIds
)


if(!advisorError){

advisors =
advisorData ?? []

}


  }

  






  return rows.map(

row => {


const resolvedAdvisor =

advisors.find(
advisor =>
advisor.id === row.assigned_to
)?.name

??

(
row.assigned_to
&&
!row.assigned_to.includes("-")
?
row.assigned_to
:
undefined
)



return {


...mapTaskRow(
row
),


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


advisorName:
resolvedAdvisor,

}

}

)


}