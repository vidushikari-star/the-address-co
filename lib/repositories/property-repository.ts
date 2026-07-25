import { supabase } from "@/lib/supabase/client"

import { mapPropertyRow } from "@/lib/mappers/property.mapper"

import type { Property } from "@/types/property"





export interface CreatePropertyDto {


  name:string

  slug:string

  developer:string


  listingType:string

  transactionType:string

  developmentStage:string

  propertyType:string


  status:string


  location:string

  locality?:string




  price:number




  bedrooms:number

  bathrooms:number

  carpetArea:number

  plotArea?:number

  builtUpArea?:number





  description?:string


  amenities?:string[]


  furnishing?:string


  googleMapLink?:string





  tags?:string[]


  coverImage?:string


  advisor:string


  note?:string


}









export async function getProperties():Promise<Property[]> {


  const {
    data,
    error,
  } =
    await supabase
      .from("properties")
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



  return (
    data ?? []
  ).map(
    mapPropertyRow
  )

}









export async function getPropertyById(
  id:string
):Promise<Property | undefined>{


  const {
    data,
    error,
  } =
    await supabase
      .from("properties")
      .select("*")
      .eq(
        "id",
        id
      )
      .single()



  if(error){

    if(error.code==="PGRST116"){

      return undefined

    }


    throw error

  }



  return mapPropertyRow(data)

}









export async function getPropertyBySlug(
  slug:string
):Promise<Property | undefined>{


  const {
    data,
    error,
  } =
    await supabase
      .from("properties")
      .select("*")
      .eq(
        "slug",
        slug
      )
      .single()



  if(error){

    if(error.code==="PGRST116"){

      return undefined

    }


    throw error

  }



  return mapPropertyRow(data)

}









export async function getPropertiesByIds(
  ids:string[]
):Promise<Property[]> {


  if(!ids.length){

    return []

  }



  const {
    data,
    error,
  } =
    await supabase
      .from("properties")
      .select("*")
      .in(
        "id",
        ids
      )



  if(error){

    throw error

  }



  return (
    data ?? []
  ).map(
    mapPropertyRow
  )

}









export async function createProperty(
  property:CreatePropertyDto
):Promise<Property>{


  const payload = {


    name:
      property.name,


    slug:
      property.slug,


    developer:
      property.developer,



    listing_type:
      property.listingType,

      transaction_type:
  property.transactionType,



    development_stage:
      property.developmentStage,



    property_type:
      property.propertyType,



    status:
      property.status,



    location:
      property.location,



    locality:
      property.locality ?? null,





    price:{

      asking:
        property.price,

    },





    specifications:{


      bedrooms:
        property.bedrooms ?? 0,


      bathrooms:
        property.bathrooms ?? 0,


      carpetArea:
        property.carpetArea ?? 0,


      plotArea:
        property.plotArea ?? 0,


      builtUpArea:
        property.builtUpArea ?? 0,


    },





    description:
      property.description ?? null,



    amenities:
      property.amenities ?? [],



    furnishing:
      property.furnishing ?? null,



    google_map_link:
      property.googleMapLink ?? null,





    tags:
      property.tags ?? [],




    cover_image:
      property.coverImage ?? null,




    advisor:
      property.advisor,




    note:
      property.note ?? null,


  }





  const {
    data,
    error,
  } =
    await supabase
      .from("properties")
      .insert(payload)
      .select()
      .single()



  if(error){

    throw error

  }



  return mapPropertyRow(data)

}









export async function updateProperty(
  id:string,
  property:Partial<CreatePropertyDto>
):Promise<Property>{



  const payload:Record<string,unknown> = {}





  if(property.name !== undefined)
    payload.name =
      property.name




  if(property.developer !== undefined)
    payload.developer =
      property.developer

      if(property.transactionType !== undefined)
  payload.transaction_type =
    property.transactionType



if(property.propertyType !== undefined)
  payload.property_type =
    property.propertyType




  if(property.location !== undefined)
    payload.location =
      property.location




  if(property.locality !== undefined)
    payload.locality =
      property.locality




  if(property.googleMapLink !== undefined)
    payload.google_map_link =
      property.googleMapLink




  if(property.description !== undefined)
    payload.description =
      property.description




  if(property.amenities !== undefined)
    payload.amenities =
      property.amenities




  if(property.furnishing !== undefined)
    payload.furnishing =
      property.furnishing






  if(property.price !== undefined)
    payload.price = {

      asking:
        property.price,

    }







  if(
    property.bedrooms !== undefined ||
    property.bathrooms !== undefined ||
    property.carpetArea !== undefined ||
    property.plotArea !== undefined ||
    property.builtUpArea !== undefined
  ){

    payload.specifications = {


      bedrooms:
        property.bedrooms ?? 0,


      bathrooms:
        property.bathrooms ?? 0,


      carpetArea:
        property.carpetArea ?? 0,


      plotArea:
        property.plotArea ?? 0,


      builtUpArea:
        property.builtUpArea ?? 0,


    }

  }





  if(property.status !== undefined)
    payload.status =
      property.status





  if(property.advisor !== undefined)
    payload.advisor =
      property.advisor





  if(property.note !== undefined)
    payload.note =
      property.note






  const {
    data,
    error,
  } =
    await supabase
      .from("properties")
      .update(payload)
      .eq(
        "id",
        id
      )
      .select()
      .single()



  if(error){

    throw error

  }



  return mapPropertyRow(data)

}









export async function deleteProperty(
  id:string
){


  const {
    error,
  } =
    await supabase
      .from("properties")
      .delete()
      .eq(
        "id",
        id
      )



  if(error){

    throw error

  }

}