import {
  supabase,
} from "@/lib/supabase/client"


export async function addContactRelationshipType(
  contactId:string,
  relationshipType:string
){

  const {
    data,
    error,
  } =
  await supabase
    .from("contacts")
    .select(
      "relationship_types"
    )
    .eq(
      "id",
      contactId
    )
    .single()


  if(error){
    throw error
  }


  const existing =
    data.relationship_types ?? []


  if(
    existing.includes(
      relationshipType
    )
  ){

    return

  }


  const updated = [
    ...existing,
    relationshipType,
  ]


  const {
    error:updateError,
  } =
  await supabase
    .from("contacts")
    .update({
      relationship_types:
        updated,
    })
    .eq(
      "id",
      contactId
    )


  if(updateError){

    throw updateError

  }

}