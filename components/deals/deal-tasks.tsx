"use client"

import {
  useState,
} from "react"

import {
  updateDeal,
} from "@/lib/repositories/deal-repository"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import type {
  Deal,
} from "@/types/deal"

import {
  Button,
} from "@/components/ui/button"

import {
  Input,
} from "@/components/ui/input"



type Props = {
  deal: Deal
}





export function DealTasks({
  deal,
}: Props) {


  const [
    tasks,
    setTasks,
  ] = useState<string[]>(

    deal.tasks ?? []

  )



  const [
    task,
    setTask,
  ] = useState("")



  const [
    saving,
    setSaving,
  ] = useState(false)





  async function addTask(){


    if(!task.trim()){

      return

    }



    const updatedTasks = [

      ...tasks,

      task.trim(),

    ]



    setSaving(true)



    try {


      await updateDeal(

        deal.id,

        {

          tasks:
            updatedTasks,


          lastActivity:
            new Date().toISOString(),

        }

      )



      await createActivity({

        type:
          "task_created",


        title:
          "Task Added",


        description:
          task.trim(),


        body:
          `New task created:
${task.trim()}`,


        dealId:
          deal.id,


        contactId:
          deal.contactId,


        propertyId:
          deal.propertyId,


        date:
          new Date().toISOString(),

      })



      setTasks(
        updatedTasks
      )


      setTask("")



    } catch(error){


      console.error(
        "Failed adding task",
        error
      )


      alert(
        "Failed adding task"
      )


    } finally {


      setSaving(false)

    }

  }






  async function removeTask(
    index:number
  ){


    const removedTask =
      tasks[index]


    const updatedTasks =
      tasks.filter(
        (_,i)=>i!==index
      )



    try {


      await updateDeal(

        deal.id,

        {

          tasks:
            updatedTasks,


          lastActivity:
            new Date().toISOString(),

        }

      )



      await createActivity({

        type:
          "task_removed",


        title:
          "Task Removed",


        description:
          removedTask,


        body:
          `Task removed:
${removedTask}`,


        dealId:
          deal.id,


        contactId:
          deal.contactId,


        propertyId:
          deal.propertyId,


        date:
          new Date().toISOString(),

      })



      setTasks(
        updatedTasks
      )



    } catch(error){


      console.error(
        "Failed removing task",
        error
      )

    }

  }





  return (

    <div className="rounded-2xl border p-6 space-y-5">


      <h2 className="font-semibold">
        Tasks
      </h2>





      <div className="space-y-3">


        {
          tasks.length === 0 ? (

            <p className="text-sm text-muted-foreground">
              No tasks yet.
            </p>

          ) : (

            tasks.map(

              (item,index)=>(

                <div

                  key={index}

                  className="flex items-center justify-between rounded-lg bg-muted p-3 text-sm"

                >

                  <span>
                    {item}
                  </span>


                  <button

                    onClick={() =>
                      removeTask(index)
                    }

                    className="text-xs text-muted-foreground hover:text-destructive"

                  >

                    Remove

                  </button>


                </div>

              )

            )

          )

        }


      </div>





      <div className="flex gap-3">


        <Input

          placeholder="Add task..."

          value={task}

          onChange={(e)=>
            setTask(
              e.target.value
            )
          }

          onKeyDown={(e)=>{

            if(
              e.key === "Enter"
            ){

              addTask()

            }

          }}

        />



        <Button

          onClick={addTask}

          disabled={saving}

        >

          {
            saving
              ? "Saving..."
              : "Add"
          }

        </Button>


      </div>


    </div>

  )

}