import { supabase } from "@/lib/supabase/client"

import { mapNoteRow } from "@/lib/mappers/note.mapper"

import type { Note } from "@/types/note"



export async function getNotesByContactId(
  contactId: string
): Promise<Note[]> {

  const {
    data,
    error,
  } =
    await supabase
      .from("notes")
      .select("*")
      .eq("contact_id", contactId)
      .order("created_at", {
        ascending: false,
      })


  if (error) {
    throw error
  }


  return (data ?? []).map(
    mapNoteRow
  )
}



export async function createNote(
  note: {
    contactId: string
    content: string
  }
): Promise<Note> {

  const {
    data,
    error,
  } =
    await supabase
      .from("notes")
      .insert({

        contact_id:
          note.contactId,

        content:
          note.content,

      })
      .select()
      .single()


  if (error) {
    throw error
  }


  return mapNoteRow(data)
}