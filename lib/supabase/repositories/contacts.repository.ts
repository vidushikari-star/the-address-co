import { supabase } from "@/lib/supabase/client"

import { mapContactRow } from "@/lib/mappers/contact.mapper"

import type { Contact } from "@/types/contact"
import type { ContactRow } from "@/types/contact-row"

import type {
  CreateContactDto,
  UpdateContactDto,
} from "@/types/dto/contact"

import {
  db,
} from "@/lib/offline/database"





function isBrowser(){

  return typeof window !== "undefined"

}





function splitFullName(
  fullName?: string
){

  if(!fullName?.trim()){

    return {
      firstName:"",
      lastName:null,
    }

  }



  const parts =
    fullName
      .trim()
      .split(/\s+/)



  return {

    firstName:
      parts.shift() ?? "",


    lastName:
      parts.length
        ? parts.join(" ")
        : null,

  }

}








export const ContactsRepository = {



  async getAll():Promise<Contact[]> {


    /*
      Offline first
    */

    if(
      isBrowser() &&
      !navigator.onLine
    ){

      console.log(
        "Offline mode: loading contacts from IndexedDB"
      )


      return await db.contacts.toArray()

    }





    try {


      const {
        data,
        error,
      } =
        await supabase
          .from("contacts")
          .select("*")
          .order(
            "created_at",
            {
              ascending:false,
            }
          )



      if(error)
        throw error



      const contacts =
        (
          data ?? []
        ).map(
          row =>
            mapContactRow(
              row as ContactRow
            )
        )



      if(
        isBrowser()
      ){

        await db.contacts.bulkPut(
          contacts
        )

      }



      return contacts



    }
    catch(error){


      console.warn(
        "Supabase unavailable. Using local contacts"
      )



      if(
        isBrowser()
      ){

        return await db.contacts.toArray()

      }



      throw error


    }


  },









  async create(
    contact:CreateContactDto
  ):Promise<Contact>{



    const {
      firstName,
      lastName,
    } =
      splitFullName(
        contact.fullName
      )





    const payload = {


      first_name:
        firstName,


      last_name:
        lastName,


      phone:
        contact.phone,


      email:
        contact.email ?? null,


      city:
        contact.city ?? null,


      country:
        contact.country ?? null,


      whatsapp:
        contact.whatsapp ?? null,


      preferred_language:
        contact.preferredLanguage ?? null,


      lead_source:
        contact.leadSource ?? null,


      relationship_types:
        contact.relationshipTypes ?? [],


      advisor_id:
        contact.advisorId ?? null,


      budget_min:
        contact.budgetMin ?? null,


      budget_max:
        contact.budgetMax ?? null,


      property_type:
        contact.propertyType ?? null,


      bedrooms:
        contact.bedrooms ?? null,


      bathrooms:
        contact.bathrooms ?? null,


      locations:
        contact.locations ?? [],


      notes:
        typeof contact.notes === "string"
          ? contact.notes
          : null,


    }





    /*
      ONLINE FLOW
    */


    if(
      isBrowser() &&
      navigator.onLine
    ){


      try{


        const {
          data,
          error,
        } =
          await supabase
            .from("contacts")
            .insert(payload)
            .select()
            .single()



        if(error)
          throw error




        const created =
          mapContactRow(
            data as ContactRow
          )



        await db.contacts.put(
          created
        )



        return created



      }
      catch(error){

        console.warn(
          "Online create failed, saving offline",
          error
        )

      }


    }





    /*
      OFFLINE FLOW
    */


    const tempId =
      crypto.randomUUID()



    const offlineContact =
      mapContactRow({

        id:
          tempId,


        ...payload,


        lead_stage:
          "new",


        created_at:
          new Date()
            .toISOString(),


      } as ContactRow)





    if(
      isBrowser()
    ){


      await db.contacts.put(
        offlineContact
      )



      await db.syncQueue.add({

        table:
          "contacts",


        action:
          "create",


        recordId:
          tempId,


        payload,


        createdAt:
          new Date()
            .toISOString(),


        synced:false,


      })


    }



    return offlineContact


  },
    async getByIdWithRelations(
    id:string
  ):Promise<Contact>{


    /*
      Offline lookup first
    */


    if(
      isBrowser() &&
      !navigator.onLine
    ){

      const cached =
        await db.contacts.get(id)


      if(cached){

        return cached

      }

    }





    const {
      data,
      error,
    } =
      await supabase
        .from("contacts")
        .select(`
          *,
          advisor:profiles(
            full_name
          )
        `)
        .eq(
          "id",
          id
        )
        .single()



    if(error)
      throw error



    const contact =
      mapContactRow(
        data as ContactRow
      )



    return {

      ...contact,


      assignedAdvisor:
        data.advisor?.full_name ??
        undefined,


      activities:
        contact.activities ?? [],


      tasks:
        contact.tasks ?? [],


      notes:
        contact.notes ?? [],

    }


  },









  async getById(
  id:string
):Promise<Contact>{


  /*
    Offline first
  */

  if(
    isBrowser() &&
    !navigator.onLine
  ){

    console.log(
      "Offline: loading contact from IndexedDB"
    )


    const cached =
      await db.contacts.get(
        id
      )


    if(cached){

      return cached

    }

  }





  try {


    const {
      data,
      error,
    } =
      await supabase
        .from("contacts")
        .select("*")
        .eq(
          "id",
          id
        )
        .single()



    if(error){

      throw error

    }





    const contact =
      mapContactRow(
        data as ContactRow
      )





    if(
      isBrowser()
    ){

      await db.contacts.put(
        contact
      )

    }





    return contact



  }
  catch(error){


    console.warn(
      "Unable to load contact from Supabase, checking local cache",
      error
    )



    if(
      isBrowser()
    ){

      const cached =
        await db.contacts.get(
          id
        )


      if(cached){

        return cached

      }

    }



    throw error


  }


},









  async update(
    id:string,
    contact:UpdateContactDto
  ):Promise<Contact>{



    /*
      Offline update
    */


    if(
      isBrowser() &&
      !navigator.onLine
    ){


      const existing =
        await db.contacts.get(id)



      if(!existing){

        throw new Error(
          "Contact not found offline"
        )

      }



      const updated: Contact = {

  ...existing,


  ...(contact.fullName !== undefined
    ? {
        name: contact.fullName,
      }
    : {}),


  ...(contact.phone !== undefined
    ? {
        phone: contact.phone,
      }
    : {}),


  ...(contact.email !== undefined
    ? {
        email: contact.email,
      }
    : {}),


  ...(contact.city !== undefined
    ? {
        city: contact.city,
      }
    : {}),


  ...(contact.country !== undefined
    ? {
        country: contact.country,
      }
    : {}),


  ...(contact.whatsapp !== undefined
    ? {
        whatsapp: contact.whatsapp,
      }
    : {}),


  ...(contact.leadSource !== undefined
    ? {
        leadSource:
          contact.leadSource as Contact["leadSource"],
      }
    : {}),


  ...(contact.purpose !== undefined
    ? {
        purpose:
          contact.purpose as Contact["purpose"],
      }
    : {}),


  notes:
    typeof contact.notes === "string"
      ? [
          {
            id:`${id}-note`,
            content:contact.notes,
            createdAt:new Date().toISOString(),
          },
        ]
      : contact.notes ?? existing.notes,


}



      await db.contacts.put(
        updated
      )



      await db.syncQueue.add({

        table:
          "contacts",


        action:
          "update",


        recordId:
          id,


        payload:
          contact,


        createdAt:
          new Date()
            .toISOString(),


        synced:false,

      })



      return updated


    }






    const {
      data,
      error,
    } =
      await supabase
        .from("contacts")
        .update(contact)
        .eq(
          "id",
          id
        )
        .select()
        .single()



    if(error)
      throw error



    const updated =
      mapContactRow(
        data as ContactRow
      )



    if(
      isBrowser()
    ){

      await db.contacts.put(
        updated
      )

    }



    return updated


  },









  async updateStage(
    id:string,
    stage:Contact["stage"]
  ):Promise<Contact>{



    if(
      isBrowser() &&
      !navigator.onLine
    ){


      const existing =
        await db.contacts.get(id)



      if(!existing){

        throw new Error(
          "Contact not found offline"
        )

      }



      const updated = {

        ...existing,

        stage,

      }



      await db.contacts.put(
        updated
      )



      await db.syncQueue.add({

        table:
          "contacts",


        action:
          "update",


        recordId:
          id,


        payload:{
          lead_stage:stage,
        },


        createdAt:
          new Date()
            .toISOString(),


        synced:false,

      })



      return updated


    }







    const {
      data,
      error,
    } =
      await supabase
        .from("contacts")
        .update({

          lead_stage:
            stage,

        })
        .eq(
          "id",
          id
        )
        .select()
        .single()



    if(error)
      throw error



    const updated =
      mapContactRow(
        data as ContactRow
      )



    if(
      isBrowser()
    ){

      await db.contacts.put(
        updated
      )

    }



    return updated


  },









  async delete(
    id:string
  ):Promise<void>{



    if(
      isBrowser() &&
      !navigator.onLine
    ){


      await db.contacts.delete(
        id
      )



      await db.syncQueue.add({

        table:
          "contacts",


        action:
          "delete",


        recordId:
          id,


        payload:{},


        createdAt:
          new Date()
            .toISOString(),


        synced:false,

      })


      return


    }







    const {
      error,
    } =
      await supabase
        .from("contacts")
        .delete()
        .eq(
          "id",
          id
        )



    if(error)
      throw error



    if(
      isBrowser()
    ){

      await db.contacts.delete(
        id
      )

    }


  },


}