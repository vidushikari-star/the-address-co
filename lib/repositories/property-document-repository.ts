import { supabase } from "@/lib/supabase/client"

import type {
  PropertyDocument,
} from "@/types/property-document"

type PropertyDocumentRow = {
  id: string
  property_id: string
  name: string
  category: PropertyDocument["category"]
  file_url: string
  file_type: string
  created_at: string
}

function mapPropertyDocumentRow(
  row: PropertyDocumentRow
): PropertyDocument {
  return {
    id:
      row.id,

    propertyId:
      row.property_id,

    name:
      row.name,

    category:
      row.category,

    fileUrl:
      row.file_url,

    fileType:
      row.file_type,

    createdAt:
      row.created_at,
  }
}

export async function getPropertyDocuments(
  propertyId: string
): Promise<PropertyDocument[]> {
  const {
    data,
    error,
  } =
    await supabase
      .from("property_documents")
      .select("*")
      .eq(
        "property_id",
        propertyId
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      )

  if (error) {
    throw error
  }

  return (
    (data as PropertyDocumentRow[] | null) ??
    []
  ).map(
    mapPropertyDocumentRow
  )
}

export async function uploadPropertyDocument(
  propertyId: string,
  file: File,
  category: string
): Promise<PropertyDocument> {
  const fileExt =
    file.name
      .split(".")
      .pop()

  const fileName =
    `${propertyId}-${Date.now()}.${fileExt}`

  const {
    error: uploadError,
  } =
    await supabase
      .storage
      .from("property-documents")
      .upload(
        fileName,
        file
      )

  if (uploadError) {
    throw uploadError
  }

  const {
    data: urlData,
  } =
    supabase
      .storage
      .from("property-documents")
      .getPublicUrl(
        fileName
      )

  const publicUrl =
    urlData.publicUrl

  const {
    data,
    error,
  } =
    await supabase
      .from("property_documents")
      .insert({
        property_id:
          propertyId,

        name:
          file.name,

        category,

        file_url:
          publicUrl,

        file_type:
          file.type,
      })
      .select()
      .single()

  if (error) {
    throw error
  }

  return mapPropertyDocumentRow(
    data as PropertyDocumentRow
  )
}

export async function deletePropertyDocument(
  id: string,
  fileUrl: string
) {
  const fileName =
    fileUrl.split(
      "/property-documents/"
    )[1]

  if (fileName) {
    await supabase
      .storage
      .from("property-documents")
      .remove([
        fileName,
      ])
  }

  const {
    error,
  } =
    await supabase
      .from("property_documents")
      .delete()
      .eq(
        "id",
        id
      )

  if (error) {
    throw error
  }
}