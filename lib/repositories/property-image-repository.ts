import { supabase } from "@/lib/supabase/client"


export interface PropertyImage {

  id:string

  propertyId:string

  url:string

  isCover:boolean

  createdAt:string

}





function mapPropertyImageRow(
  row:any
):PropertyImage {


  return {

    id:
      row.id,

    propertyId:
      row.property_id,

    url:
      row.url,

    isCover:
      row.is_cover,

    createdAt:
      row.created_at,

  }

}








export async function getPropertyImages(
  propertyId:string
):Promise<PropertyImage[]> {


  const {
    data,
    error,
  } =
  await supabase
    .from("property_images")
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
    mapPropertyImageRow
  )

}








export async function uploadPropertyImage(
  propertyId:string,
  file:File
):Promise<PropertyImage>{


  const fileExt =
    file.name
    .split(".")
    .pop()



  const fileName =
    `${propertyId}-${Date.now()}.${fileExt}`



  const {
    error:uploadError,
  } =
  await supabase
    .storage
    .from("property-images")
    .upload(
      fileName,
      file
    )



  if(uploadError){

    throw uploadError

  }






  const {
    data:urlData,
  } =
  supabase
    .storage
    .from("property-images")
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
    .from("property_images")
    .insert({

      property_id:
        propertyId,


      url:
        publicUrl,


      is_cover:
        false,


    })
    .select()
    .single()



  if(error){

    throw error

  }





  /*
    Automatically set first uploaded image
    as property thumbnail
  */


  const {
    data:property,
  } =
  await supabase
    .from("properties")
    .select(
      "cover_image"
    )
    .eq(
      "id",
      propertyId
    )
    .single()





  if(
    !property?.cover_image
  ){

    await supabase
      .from("properties")
      .update({

        cover_image:
          publicUrl,

      })
      .eq(
        "id",
        propertyId
      )

  }





  return mapPropertyImageRow(
    data
  )

}








export async function deletePropertyImage(
  id:string,
  url:string
){


  const fileName =
    url.split(
      "/property-images/"
    )[1]



  if(fileName){


    await supabase
      .storage
      .from("property-images")
      .remove([
        fileName
      ])

  }





  const {
    error,
  } =
  await supabase
    .from("property_images")
    .delete()
    .eq(
      "id",
      id
    )



  if(error){

    throw error

  }

}








export async function setCoverImage(
  id:string,
  propertyId:string
){


  const {
    data:image,
  } =
  await supabase
    .from("property_images")
    .select(
      "url"
    )
    .eq(
      "id",
      id
    )
    .single()



  if(!image){

    throw new Error(
      "Image not found"
    )

  }





  await supabase
    .from("property_images")
    .update({

      is_cover:false,

    })
    .eq(
      "property_id",
      propertyId
    )





  const {
    data,
    error,
  } =
  await supabase
    .from("property_images")
    .update({

      is_cover:true,

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





  await supabase
    .from("properties")
    .update({

      cover_image:
        image.url,

    })
    .eq(
      "id",
      propertyId
    )





  return mapPropertyImageRow(
    data
  )

}