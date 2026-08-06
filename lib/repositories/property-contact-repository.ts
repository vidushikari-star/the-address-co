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








export interface PropertySource {


  id:string


  relationshipType:
    PropertyContactRelationship



  contact:{

    id:string

    name:string

    phone?:string

    email?:string

  }



  commission?:{

    percentage?:number

    amount?:number

    commissionType?:string

    commissionBasis?:string

  }

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









export async function getPropertySources(
propertyId:string
):Promise<PropertySource[]> {



  const {
    data,
    error,
  } =
  await supabase

    .from("property_contacts")

    .select(`

      id,

      relationship_type,

      contacts(
        id,
        full_name,
        phone,
        email
      )

    `)

    .eq(
      "property_id",
      propertyId
    )







  if(error){

    throw error

  }






  const {
  data:commissions,
  error:commissionError,
} =
await supabase
  .from("property_commissions")
  .select(`

    id,

    property_id,

    contact_id,

    source_type,

    commission_type,

    percentage,

    amount

  `)

    .eq(
      "property_id",
      propertyId
    )






  if(commissionError){

    throw commissionError

  }







  return (

    data ?? []

  )

  .map(

    item => {


      const contact =

        Array.isArray(
          item.contacts
        )

        ?

        item.contacts[0]

        :

        item.contacts





      const commission =

        commissions?.find(

          c =>

            c.contact_id ===
            contact?.id

        )







      return {


        id:
          item.id,



        relationshipType:
          item.relationship_type,



        contact:{

          id:
            contact?.id
            ??
            "",


          name:
            contact?.full_name
            ??
            "",


          phone:
            contact?.phone
            ??
            "",


          email:
            contact?.email
            ??
            "",

        },



        commission:

          commission

          ?

          {

            percentage:
              commission.percentage
              ??
              undefined,


            amount:
              commission.amount
              ??
              undefined,


            commissionType:
              commission.commission_type
              ??
              undefined,


           


          }

          :

          undefined,


      }


    }

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