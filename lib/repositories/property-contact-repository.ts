import {
  supabase,
} from "@/lib/supabase/client"


import type {
  PropertyContactRelationship,
} from "@/types/property"




export interface PropertyContact {

  id:string

  propertyId:string

  contactId:string

  relationshipType:
    PropertyContactRelationship

  createdAt:string

  updatedAt:string

}





type PropertyContactRow = {

  id:string

  property_id:string

  contact_id:string

  relationship_type:
    PropertyContactRelationship

  created_at:string

  updated_at:string

}





function mapPropertyContact(
  row:PropertyContactRow
):PropertyContact {

  return {

    id:
      row.id,


    propertyId:
      row.property_id,


    contactId:
      row.contact_id,


    relationshipType:
      row.relationship_type,


    createdAt:
      row.created_at,


    updatedAt:
      row.updated_at,

  }

}








export async function getPropertyContacts(
  propertyId:string
):Promise<PropertyContact[]> {


  const {
    data,
    error,
  } =
  await supabase
    .from("property_contacts")
    .select("*")
    .eq(
      "property_id",
      propertyId
    )
    .order(
      "created_at",
      {
        ascending:true,
      }
    )



  if(error){

    throw error

  }



  return (

    data ?? []

  )
  .map(
    row =>
      mapPropertyContact(
        row as PropertyContactRow
      )
  )


}









export async function addPropertyContact({

  propertyId,

  contactId,

  relationshipType,

}:{

  propertyId:string

  contactId:string

  relationshipType:
    PropertyContactRelationship

}):Promise<PropertyContact>{



  const {
    data,
    error,
  } =
  await supabase
    .from("property_contacts")
    .insert({

      property_id:
        propertyId,


      contact_id:
        contactId,


      relationship_type:
        relationshipType,

    })
    .select()
    .single()



  if(error){

    throw error

  }



  return mapPropertyContact(
    data as PropertyContactRow
  )


}









export async function removePropertyContact(
  id:string
){


  const {
    error,
  } =
  await supabase
    .from("property_contacts")
    .delete()
    .eq(
      "id",
      id
    )



  if(error){

    throw error

  }


}









export async function updatePropertyContact({

  id,

  relationshipType,

}:{

  id:string

  relationshipType:
    PropertyContactRelationship

}):Promise<PropertyContact>{



  const {
    data,
    error,
  } =
  await supabase
    .from("property_contacts")
    .update({

      relationship_type:
        relationshipType,

    })
    .eq(
      "id",
      id
    )
    .select()
    .single()



  if(error){

    throw error

  }



  return mapPropertyContact(
    data as PropertyContactRow
  )


}