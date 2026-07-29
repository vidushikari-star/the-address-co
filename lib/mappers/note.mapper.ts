import type { Note } from "@/types/note"

type NoteRow = {
  id: string
  content: string | null
  created_at: string | null
}

export function mapNoteRow(
  row: NoteRow
): Note {
  return {
    id: row.id,

    content: row.content ?? "",

    createdAt:
      row.created_at ??
      new Date().toISOString(),
  }
}