"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  FormDrawer,
} from "./form-drawer"

import {
  Input,
} from "@/components/ui/input"

import {
  Button,
} from "@/components/ui/button"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"





type ActivityDrawerProps = {
  open:boolean
  onOpenChange:(open:boolean)=>void

  dealId:string
  contactId?:string
  propertyId?:string
}



export function ActivityDrawer({
  open,
  onOpenChange,
  dealId,
  contactId,
  propertyId,
}:ActivityDrawerProps){



  const router =
    useRouter()





  const [
    loading,
    setLoading,
  ] = useState(false)



  const [
    form,
    setForm,
  ] = useState({

    type:"note",

    title:"",

    body:"",

  })




  function update(
    key:string,
    value:string
  ){

    setForm(
      current=>({

        ...current,

        [key]:
          value,

      })
    )

  }





  async function submit(
    e:React.FormEvent
  ){

    e.preventDefault()


    setLoading(true)


    try{


      await createActivity({

        type:
          form.type as any,


        title:
          form.title,


        body:
          form.body,


        dealId,


        contactId,


        propertyId,


        date:
          new Date().toISOString(),

      })



      setForm({

        type:"note",

        title:"",

        body:"",

      })



      await new Promise(
  resolve => setTimeout(resolve, 300)
)

onOpenChange(false)

router.refresh()



    }catch(error){


      console.error(
        "Activity creation failed",
        error
      )


      alert(
        "Could not create activity"
      )


    }finally{

      setLoading(false)

    }

  }





  return (

    <FormDrawer

      open={
        open
      }

      onOpenChange={
        onOpenChange
      }

      title="Add Activity"

      description="Record interaction with buyer."

    >


      <form

        onSubmit={
          submit
        }

        className="space-y-5"

      >



        <select

          className="w-full rounded-lg border p-3"

          value={
            form.type
          }

          onChange={(e)=>
            update(
              "type",
              e.target.value
            )
          }

        >

          <option value="note">
            Note
          </option>

          <option value="call">
            Call
          </option>

          <option value="whatsapp">
            WhatsApp
          </option>

          <option value="meeting">
            Meeting
          </option>

          <option value="site_visit">
            Site Visit
          </option>

        </select>





        <Input

          placeholder="Activity title"

          value={
            form.title
          }

          onChange={(e)=>
            update(
              "title",
              e.target.value
            )
          }

        />





        <textarea

          className="min-h-32 w-full rounded-lg border p-3"

          placeholder="Details..."

          value={
            form.body
          }

          onChange={(e)=>
            update(
              "body",
              e.target.value
            )
          }

        />





        <Button

          type="submit"

          disabled={
            loading
          }

        >

          {
            loading
              ? "Saving..."
              : "Save Activity"
          }

        </Button>


      </form>


    </FormDrawer>

  )


}