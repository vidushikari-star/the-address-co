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
  Textarea,
} from "@/components/ui/textarea"



type Props = {
  deal: Deal
}



export function DealNotes({
  deal,
}: Props) {


  const [
    notes,
    setNotes,
  ] = useState<string[]>(

    deal.notes ?? []

  )



  const [
    newNote,
    setNewNote,
  ] = useState("")



  const [
    saving,
    setSaving,
  ] = useState(false)



  async function addNote() {


    if (!newNote.trim()) {
      return
    }



    setSaving(true)



    const updatedNotes = [

      ...notes,

      newNote.trim(),

    ]



    try {


      await updateDeal(

        deal.id,

        {

          notes:
            updatedNotes,

        }

      )



      await createActivity({

        type:
          "note",


        title:
          "Note added",


        description:
          deal.name,


        body:
          newNote.trim(),


        dealId:
          deal.id,


        contactId:
          deal.contactId,


        propertyId:
          deal.propertyId,


        date:
          new Date().toISOString(),

      })



      setNotes(
        updatedNotes
      )


      setNewNote("")



    } catch(error) {


      console.error(
        "Failed adding note",
        error
      )


      alert(
        "Failed adding note"
      )


    } finally {


      setSaving(false)

    }

  }




  return (

    <div className="rounded-2xl border p-6 space-y-5">


      <h2 className="font-semibold">

        Notes

      </h2>



      <div className="space-y-3">


        {
          notes.length === 0 ? (

            <p className="text-sm text-muted-foreground">
              No notes yet.
            </p>

          ) : (

            notes.map(
              (note,index)=>(

                <div

                  key={index}

                  className="rounded-lg bg-muted p-3 text-sm"

                >

                  {note}

                </div>

              )
            )

          )
        }


      </div>




      <Textarea

        placeholder="Add a note..."

        value={
          newNote
        }

        onChange={(e)=>
          setNewNote(
            e.target.value
          )
        }

      />



      <Button

        onClick={addNote}

        disabled={saving}

      >

        {
          saving
          ? "Saving..."
          : "Add Note"
        }

      </Button>


    </div>

  )

}