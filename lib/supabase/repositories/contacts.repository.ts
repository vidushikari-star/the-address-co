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
) {

  if (!fullName?.trim()) {

    return {
      firstName:"",
      lastName:null,
    }

  }


  const parts =
    fullName.trim().split(/\s+/)


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



      if(error){

        throw error

      }



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



    } catch(error){


      console.warn(
        "Offline mode: loading cached contacts"
      )



      if(
        !isBrowser()
      ){

        throw error

      }



      return await db.contacts.toArray()


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
        contact.locations ?? null,


      notes:
        typeof contact.notes === "string"
          ? contact.notes
          : null,


    }





    try {


      const {
        data,
        error,
      } =
        await supabase
          .from("contacts")
          .insert(payload)
          .select()
          .single()



      if(error){

        throw error

      }



      const mapped =
        mapContactRow(
          data as ContactRow
        )



      if(
        isBrowser()
      ){

        await db.contacts.put(
          mapped
        )

      }



      return mapped



    } catch(error){



      if(
        !isBrowser()
      ){

        throw error

      }




      const tempId =
        crypto.randomUUID()



      const offlineContact =
        mapContactRow({

          id:
            tempId,


          ...payload,


          created_at:
            new Date()
              .toISOString(),


        } as ContactRow)





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


        synced:
          false,


      })



      return offlineContact


    }


  },









  async getByIdWithRelations(
    id:string
  ):Promise<Contact>{


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



    if(error){

      throw error

    }



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


    const {
      data,
      error
    } =
      await supabase
        .from("contacts")
        .select("*")
        .eq(
          "id",
          id
        )
        .single()



    if(error)

      throw error



    return mapContactRow(
      data as ContactRow
    )


  },









  async update(
    id:string,
    contact:UpdateContactDto
  ):Promise<Contact>{


    const {
      data,
      error
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


    const {
      data,
      error,
    } =
      await supabase
        .from("contacts")
        .update({
          lead_stage: stage,
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