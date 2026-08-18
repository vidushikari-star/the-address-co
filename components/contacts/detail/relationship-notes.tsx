"use client"

import {
  useEffect,
  useState,
} from "react"

import type {
  Contact,
} from "@/types"

import type {
  Note,
} from "@/types/note"

import {
  getNotesByContactId,
  createNote,
} from "@/lib/repositories/note-repository"

import {
  Button,
} from "@/components/ui/button"

import {
  Textarea,
} from "@/components/ui/textarea"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
  DashboardCardTitle,
} from "@/components/ui/dashboard-card"





type Props = {

  contact: Contact

}








export function RelationshipNotes({
  contact,
}:Props){



  const [
    notes,
    setNotes,
  ] =
  useState<Note[]>([])



  const [
    newNote,
    setNewNote,
  ] =
  useState("")



  const [
    loading,
    setLoading,
  ] =
  useState(true)



  const [
    saving,
    setSaving,
  ] =
  useState(false)








  useEffect(()=>{


    async function loadNotes(){


      try{


        const data =
          await getNotesByContactId(
            contact.id
          )


        setNotes(
          data
        )


      }
      finally{

        setLoading(false)

      }


    }



    loadNotes()


  },[
    contact.id
  ])








  async function addNote(){


    if(
      !newNote.trim()
      ||
      saving
    ){

      return

    }





    setSaving(true)



    try{


      const note =
        await createNote({

          contactId:
            contact.id,

          content:
            newNote.trim(),

        })



      setNotes(
        current => [
          note,
          ...current,
        ]
      )



      setNewNote("")


    }
    finally{

      setSaving(false)

    }


  }









  return (

    <DashboardCard className="
      rounded-2xl
    ">



      <DashboardCardHeader>


        <DashboardCardTitle>

          Advisor Notes

        </DashboardCardTitle>


      </DashboardCardHeader>







      <DashboardCardContent className="
        space-y-5
      ">

        {contact.notesText && (
          <div className="rounded-xl border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Contact notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{contact.notesText}</p>
          </div>
        )}





        <div className="
          space-y-3
          rounded-xl
          border
          p-3
        ">


          <Textarea

            placeholder="Add advisor note..."

            value={
              newNote
            }

            onChange={
              e =>
                setNewNote(
                  e.target.value
                )
            }

            className="
              min-h-28
              resize-none
            "

          />




          <Button

            size="sm"

            disabled={
              saving
            }

            onClick={
              addNote
            }

            className="
              w-full
              sm:w-auto
            "

          >

            {
              saving
              ?
              "Saving..."
              :
              "Add Note"
            }


          </Button>


        </div>








        {
          loading ? (

            <p className="
              text-sm
              text-muted-foreground
            ">

              Loading notes...

            </p>

          )

          :

          notes.length === 0 ? (

            <div className="
              rounded-xl
              border
              border-dashed
              p-6
              text-center
              text-sm
              text-muted-foreground
            ">

              No notes yet.

            </div>

          )


          :

          (

            <div className="
              space-y-3
            ">


              {
                notes.map(
                  note => (

                    <div

                      key={
                        note.id
                      }

                      className="
                        rounded-xl
                        border
                        bg-card
                        p-4
                      "

                    >



                      <p className="
                        whitespace-pre-wrap
                        text-sm
                        leading-6
                      ">

                        {note.content}

                      </p>





                      <p className="
                        mt-3
                        text-xs
                        text-muted-foreground
                      ">

                        {
                          new Date(
                            note.createdAt
                          )
                          .toLocaleDateString(
                            "en-IN",
                            {
                              day:"numeric",
                              month:"short",
                              year:"numeric",
                            }
                          )
                        }

                      </p>


                    </div>

                  )

                )

              }


            </div>

          )

        }




      </DashboardCardContent>


    </DashboardCard>

  )

}
