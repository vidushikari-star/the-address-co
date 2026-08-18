import { supabase } from "@/lib/supabase/client"

import { mapContactRow } from "@/lib/mappers/contact.mapper"

import type { Contact } from "@/types/contact"
import type { ContactRow } from "@/types/contact-row"
import type {
  CreateContactDto,
  UpdateContactDto,
} from "@/types/dto/contact"
import { createActivity } from "@/lib/repositories/activity-repository"


function splitFullName(fullName?: string) {

  if (!fullName?.trim()) {

    return {

      firstName: "",

      lastName: null,

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


  async getAll(): Promise<Contact[]> {

const {
data,
error,
} =
await supabase
.from("contacts")
.select(`
  *,
  advisor:profiles!contacts_advisor_id_fkey(
    id,
    full_name
  )
`)
.order(
"created_at",
{
ascending:false,
}
)


    if(error)
      throw error


    return (
data ?? []
).map(
row => {

const contact =
mapContactRow(
row as ContactRow
)


return {

...contact,

advisorId:
row.advisor?.id ?? undefined,

assignedAdvisor:
row.advisor?.full_name ?? undefined,

}

}
)

  },







  async getById(
id: string
): Promise<Contact | null> {

const {
data,
error,
} =
await supabase
.from("contacts")
.select(`
  *,
  advisor:profiles!contacts_advisor_id_fkey(
    id,
    full_name
  )
`)
.eq(
"id",
id
)
.maybeSingle()


if(error){
throw error
}


if(!data){
return null
}


const contact =
mapContactRow(
data as ContactRow
)


return {

...contact,

assignedAdvisor:
data.advisor?.full_name ?? undefined,

}

},

async getByIdWithRelations(
id: string
): Promise<Contact | null> {

const {
data,
error,
} =
await supabase
.from("contacts")
.select(`
  *,
  advisor:profiles!contacts_advisor_id_fkey(
    id,
    full_name
  )
`)
.eq(
"id",
id
)
.maybeSingle()


if(error){
throw error
}


if(!data){
return null
}


const contact =
mapContactRow(
data as ContactRow
)


return {

...contact,

assignedAdvisor:
data.advisor?.full_name ?? undefined,

activities:
contact.activities ?? [],

tasks:
contact.tasks ?? [],

notes:
contact.notes ?? [],

}

},







  async create(
  contact: CreateContactDto
): Promise<Contact> {

  const {
    firstName,
    lastName,
  } = splitFullName(
    contact.fullName
  )


  const {
    data: {
      user,
    },
  } = await supabase.auth.getUser()



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

      intent:
  contact.intent ?? null,

      relationship_types:
  contact.relationshipTypes ?? [],


    advisor_id:
      contact.advisorId ?? user?.id ?? null,


    created_by:
      user?.id ?? null,


    owner_id:
      user?.id ?? null,


    is_private:
      false,


    budget_min:
      contact.budgetMin ?? null,


    budget_max:
      contact.budgetMax ?? null,


    currency:
      contact.currency ?? null,


    purpose:
      contact.purpose || null,


    timeline:
      contact.timeline ?? null,


    financing:
      contact.financing || null,


    resident:
      contact.resident ?? null,


    property_type:
      contact.propertyType ?? null,


    bedrooms:
      contact.bedrooms ?? null,


    bathrooms:
      contact.bathrooms ?? null,


    locations:
      contact.locations ?? null,


    min_area:
      contact.minArea ?? null,


    max_area:
      contact.maxArea ?? null,


    plot_size:
      contact.plotSize ?? null,


    must_have:
      contact.mustHave ?? null,


    nice_to_have:
      contact.niceToHave ?? null,


    spouse_name:
      contact.spouseName ?? null,


    co_buyer:
      contact.coBuyer ?? null,


        referral_source:
      contact.referralSource ?? null,


    notes:
      typeof contact.notes === "string"
        ? contact.notes
        : null,


    private_notes:
      contact.privateNotes ?? null,


    next_follow_up_at:
      contact.nextFollowUpAt ?? null,

  }



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



  const created = mapContactRow(data as ContactRow)
  try {
    await createActivity({
      contactId: created.id,
      type: "contact_created",
      title: "Created relationship",
      description: "Created contact details",
    })
  } catch (activityError) {
    console.error("Contact creation activity log failed", { code: activityError instanceof Error ? activityError.name : "unknown" })
  }
  return created

},









  async update(
    id:string,
    contact:UpdateContactDto
  ):Promise<Contact>{


    const payload:Record<string,unknown> = {}

    





    if(contact.fullName !== undefined){


      const {
        firstName,
        lastName,
      } =
        splitFullName(
          contact.fullName
        )


      payload.first_name =
        firstName


      payload.last_name =
        lastName

    }





    if(contact.phone !== undefined)

      payload.phone =
        contact.phone





    if(contact.email !== undefined)

      payload.email =
        contact.email ?? null





    if(contact.city !== undefined)

      payload.city =
        contact.city ?? null





    if(contact.country !== undefined)

      payload.country =
        contact.country ?? null





    if(contact.whatsapp !== undefined)

      payload.whatsapp =
        contact.whatsapp ?? null

    if(contact.bedrooms !== undefined)

      payload.bedrooms =
        contact.bedrooms || null

    if(contact.bathrooms !== undefined)

      payload.bathrooms =
        contact.bathrooms ?? null





    if(contact.advisorId !== undefined)

  payload.advisor_id =
    contact.advisorId ?? null

        if(contact.leadSource !== undefined)

  payload.lead_source =
    contact.leadSource ?? null

    if(contact.relationshipTypes !== undefined)

  payload.relationship_types =
    contact.relationshipTypes ?? []





    if(contact.budgetMin !== undefined)

  payload.budget_min =
    contact.budgetMin ?? null



if(contact.budgetMax !== undefined)

  payload.budget_max =
    contact.budgetMax ?? null



if(contact.propertyType !== undefined)

  payload.property_type =
    contact.propertyType ?? null



if(contact.bedrooms !== undefined)

  payload.bedrooms =
    contact.bedrooms || null



if(contact.locations !== undefined)

  payload.locations =
    contact.locations ?? null



if(contact.purpose !== undefined)

  payload.purpose =
    contact.purpose || null



if(contact.financing !== undefined)

  payload.financing =
    contact.financing || null



if(contact.timeline !== undefined)

  payload.timeline =
    contact.timeline ?? null



if(contact.mustHave !== undefined)

  payload.must_have =
    contact.mustHave ?? null

if(contact.niceToHave !== undefined)

  payload.nice_to_have =
    contact.niceToHave ?? null

if(contact.resident !== undefined)

  payload.resident =
    contact.resident ?? null

if(contact.minArea !== undefined)

  payload.min_area =
    contact.minArea ?? null

if(contact.maxArea !== undefined)

  payload.max_area =
    contact.maxArea ?? null

if(contact.plotSize !== undefined)

  payload.plot_size =
    contact.plotSize ?? null

if(contact.spouseName !== undefined)

  payload.spouse_name =
    contact.spouseName ?? null

if(contact.coBuyer !== undefined)

  payload.co_buyer =
    contact.coBuyer ?? null

if(contact.referralSource !== undefined)

  payload.referral_source =
    contact.referralSource ?? null

if(contact.notes !== undefined)

  payload.notes =
    contact.notes ?? null

if(contact.privateNotes !== undefined)

  payload.private_notes =
    contact.privateNotes ?? null



if(contact.leadSource !== undefined)

  payload.lead_source =
    contact.leadSource ?? null

    if(contact.intent !== undefined)

  payload.intent =
    contact.intent ?? null

    if(contact.nextFollowUpAt !== undefined)

  payload.next_follow_up_at =
    contact.nextFollowUpAt ?? null



    const {
      data,
      error,
    } =
      await supabase
        .from("contacts")
        .update(payload)
        .eq(
          "id",
          id
        )
        .select()
        .single()



    if(error)
      throw error



    const updated = mapContactRow(data as ContactRow)
    try {
      await createActivity({
        contactId: updated.id,
        type: "note",
        title: "Updated contact details",
        description: "Updated relationship details",
      })
    } catch (activityError) {
      console.error("Contact update activity log failed", { code: activityError instanceof Error ? activityError.name : "unknown" })
    }
    return updated


  },







async updateStage(
  id: string,
  stage: Contact["stage"]
): Promise<Contact> {

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


  return mapContactRow(
    data as ContactRow
  )

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


  },


}
