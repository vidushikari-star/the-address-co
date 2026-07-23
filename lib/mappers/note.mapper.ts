import type { Note } from "@/types/note"


export function mapNoteRow(
  row: any
): Note {

  return {

    id:
      row.id,

    content:
      row.content ?? "",

    createdAt:
      row.created_at ??
      new Date().toISOString(),

  }
}