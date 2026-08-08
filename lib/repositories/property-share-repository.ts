import { supabase } from "@/lib/supabase/client"


export type PropertyShareStatus =
  | "shared"
  | "viewed"
  | "interested"
  | "site_visit"
  | "rejected"



export interface PropertyShare {

  id: string

  dealId: string

  contactId: string

  propertyId: string

  status: PropertyShareStatus

  buyerFeedback?: string

  notes?: string

  sharedAt: string

  createdAt: string

}



type PropertyShareRow = {

  id: string

  deal_id: string

  contact_id: string

  property_id: string

  status: PropertyShareStatus

  buyer_feedback: string | null

  notes: string | null

  shared_at: string

  created_at: string

}



function mapPropertyShareRow(
  row: PropertyShareRow
): PropertyShare {

return {

id:
row.id,


dealId:
row.deal_id,


contactId:
row.contact_id,


propertyId:
row.property_id,


status:
row.status,


buyerFeedback:
row.buyer_feedback ?? undefined,


notes:
row.notes ?? undefined,


sharedAt:
row.shared_at,


createdAt:
row.created_at,

}

}





export async function createPropertyShare(
data: {
  dealId?: string
  contactId?: string
  propertyId?: string
  notes?: string
}
): Promise<PropertyShare> {


const {
data: row,
error,
} =
await supabase
.from("property_shares")
.insert({

deal_id:
data.dealId ?? null,


contact_id:
data.contactId ?? null,


property_id:
data.propertyId ?? null,


status:
"shared",


shared_at:
new Date().toISOString(),


notes:
data.notes ?? null,

})
.select()
.single()



if(error){

throw error

}



return mapPropertyShareRow(
row as PropertyShareRow
)

}





export async function getPropertySharesByDealId(
dealId: string
): Promise<PropertyShare[]> {


const {
data,
error,
} =
await supabase
.from("property_shares")
.select("*")
.eq(
"deal_id",
dealId
)
.order(
"created_at",
{
ascending:false,
}
)



if(error){

throw error

}



return (
(data as PropertyShareRow[] | null) ?? []
)
.map(
mapPropertyShareRow
)

}





export async function getPropertySharesByContactId(
contactId:string
): Promise<PropertyShare[]> {


const {
data,
error,
} =
await supabase
.from("property_shares")
.select("*")
.eq(
"contact_id",
contactId
)
.order(
"created_at",
{
ascending:false,
}
)



if(error){

throw error

}



return (
(data as PropertyShareRow[] | null) ?? []
)
.map(
mapPropertyShareRow
)

}





export async function updatePropertyShareStatus(
id:string,
status:PropertyShareStatus,
buyerFeedback?:string
): Promise<PropertyShare> {


const {
data,
error,
} =
await supabase
.from("property_shares")
.update({

status,


buyer_feedback:
buyerFeedback ?? null,

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



return mapPropertyShareRow(
data as PropertyShareRow
)

}





export async function getLastSharedByPropertyId(
propertyId:string
): Promise<string | null> {


const {
data,
error,
} =
await supabase
.from("property_shares")
.select("shared_at")
.eq(
"property_id",
propertyId
)
.order(
"shared_at",
{
ascending:false,
}
)
.limit(1)
.maybeSingle()



if(error){

throw error

}



return data?.shared_at ?? null

}