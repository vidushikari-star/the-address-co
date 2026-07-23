"use client"

import {
  useEffect,
  useState,
} from "react"

import type { Contact } from "@/types"

import type { Note } from "@/types/note"

import {
  getNotesByContactId,
  createNote,
} from "@/lib/repositories/note-repository"

import {
  Button,
} from "@/components/ui/button"

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
}: Props) {

  const [
    notes,
    setNotes,
  ] = useState<Note[]>([])


  const [
    newNote,
    setNewNote,
  ] = useState("")



  useEffect(() => {

    async function loadNotes() {

      try {

        const data =
          await getNotesByContactId(
            contact.id
          )

        setNotes(data)

      } catch (error) {

        console.error(
          "Failed loading notes",
          error
        )

      }

    }


    loadNotes()

  }, [contact.id])



  async function addNote() {

    if (!newNote.trim()) {
      return
    }


    try {

      const note =
        await createNote({

          contactId:
            contact.id,

          content:
            newNote,

        })


      setNotes(
        (current) => [
          note,
          ...current,
        ]
      )


      setNewNote("")


    } catch (error) {

      console.error(
        "Failed creating note",
        error
      )

    }

  }



  return (

    <DashboardCard>

      <DashboardCardHeader>

        <DashboardCardTitle>
          Advisor Notes
        </DashboardCardTitle>

      </DashboardCardHeader>



      <DashboardCardContent className="space-y-4">


        <textarea
          className="w-full rounded-xl border p-3 text-sm"
          placeholder="Add advisor note..."
          value={newNote}
          onChange={(e) =>
            setNewNote(
              e.target.value
            )
          }
        />


        <Button
          size="sm"
          onClick={addNote}
        >
          Add Note
        </Button>



        {notes.length === 0 ? (

          <p className="text-sm text-muted-foreground">
            No notes yet.
          </p>

        ) : (

          notes.map(
            (note) => (

              <div
                key={note.id}
                className="rounded-xl border p-5"
              >

                <p className="text-sm leading-7">
                  {note.content}
                </p>


                <p className="mt-2 text-xs text-muted-foreground">

                  {new Date(
                    note.createdAt
                  ).toLocaleDateString()}

                </p>

              </div>

            )
          )

        )}


      </DashboardCardContent>

    </DashboardCard>

  )
}