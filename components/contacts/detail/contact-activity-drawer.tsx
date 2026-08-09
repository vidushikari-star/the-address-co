"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  FormDrawer,
} from "@/components/forms/form-drawer"

import {
  Button,
} from "@/components/ui/button"

import {
  Input,
} from "@/components/ui/input"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import type {
  ActivityType,
} from "@/types/activity"



type Props = {

  open:boolean

  onOpenChange:(open:boolean)=>void

  contactId:string

}





export function ContactActivityDrawer({
  open,
  onOpenChange,
  contactId,
}:Props){


  const router =
    useRouter()



  const [
    loading,
    setLoading,
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

    type:
      "note" as ActivityType,

    title:
      "",

    body:
      "",

    nextFollowUpAt:
      "",

  })





  function update(
    key:
      | "type"
      | "title"
      | "body"
      | "nextFollowUpAt",
    value:string
  ){

    setForm(
      current => ({

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

    if(!form.title.trim()){

      setError("Activity title is required.")

      return

    }


    setLoading(true)
    setError(null)


    try{


      await createActivity({

        contactId,

        type:
          form.type,

        title:
          form.title.trim(),

        body:
          form.body,

        date:
          new Date()
            .toISOString(),

        nextFollowUpAt:
          form.nextFollowUpAt
            ? new Date(
                form.nextFollowUpAt
              ).toISOString()
            : undefined,

      })


      onOpenChange(false)


      router.refresh()


    }
    catch(error){

      console.error("Unable to save contact activity", error)
      setError("Unable to save the activity. Please try again.")

    }
    finally{

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

    >


      <form

        onSubmit={
          submit
        }

        className="
          space-y-4
        "

      >



        <select

          className="
            w-full
            rounded-md
            border
            px-3
            py-2
          "

          value={
            form.type
          }

          onChange={
            e =>
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

          <option value="meeting">
            Meeting
          </option>

          <option value="site_visit">
            Site Visit
          </option>

          <option value="email">
            Email
          </option>

          <option value="whatsapp">
            WhatsApp
          </option>

        </select>





        <Input

          placeholder="Activity title"

          required

          value={
            form.title
          }

          onChange={
            e =>
              update(
                "title",
                e.target.value
              )
          }

        />





        <textarea

          className="
            min-h-24
            w-full
            rounded-md
            border
            p-3
            text-sm
          "

          placeholder="Description"

          value={
            form.body
          }

          onChange={
            e =>
              update(
                "body",
                e.target.value
              )
          }

        />





        <div className="space-y-2">

          <label className="
            text-sm
            font-medium
          ">

            Next Follow Up

          </label>


          <Input

            type="datetime-local"

            value={
              form.nextFollowUpAt
            }

            onChange={
              e =>
                update(
                  "nextFollowUpAt",
                  e.target.value
                )
            }

          />


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

          disabled={loading}

          onClick={() => onOpenChange(false)}

        >

          Cancel

        </Button>

        <Button

          type="submit"

          disabled={
            loading
          }

          className="w-full sm:w-auto"

        >

          {
            loading
              ? "Saving..."
              : "Save Activity"
          }

        </Button>
        </div>



      </form>


    </FormDrawer>

  )

}
