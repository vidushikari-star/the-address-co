import { supabase } from "@/lib/supabase/client"

export interface PropertyImage {
  id: string
  propertyId: string
  url: string
  isCover: boolean
  createdAt: string
}


type PropertyImageRow = {
  id: string
  property_id: string
  url: string
  is_cover: boolean
  created_at: string
}


type PropertyCoverRow = {
  cover_image: string | null
}


type PropertyImageUrlRow = {
  url: string
}




function mapPropertyImageRow(
  row: PropertyImageRow
): PropertyImage {

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
  propertyId: string
): Promise<PropertyImage[]> {


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
          ascending: true,
        }
      )


  if(error){

    throw error

  }


  return (
    (data as PropertyImageRow[] | null) ??
    []
  )
  .map(
    mapPropertyImageRow
  )

}








export async function uploadPropertyImage(
  propertyId: string,
  file: File
): Promise<PropertyImage> {


  const fileExt =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase() || "jpg"





  const fileName =
    `${propertyId}/${crypto.randomUUID()}.${fileExt}`





  const {
    error: uploadError,
  } =
    await supabase
      .storage
      .from("property-images")
      .upload(
        fileName,
        file,
        {
          upsert: false,
        }
      )



  if(uploadError){

    throw uploadError

  }






  const {
    data: urlData,
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







  const {
    data: property,
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



  const propertyRow =
    property as PropertyCoverRow | null






  if(
    !propertyRow?.cover_image
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
    data as PropertyImageRow
  )

}








export async function deletePropertyImage(
  id: string,
  url: string
) {


  const fileName =
    url.split(
      "/property-images/"
    )[1]



  if(fileName){

    await supabase
      .storage
      .from("property-images")
      .remove([
        fileName,
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
  id: string,
  propertyId: string
) {


  const {
    data: image,
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



  const imageRow =
    image as PropertyImageUrlRow | null





  if(!imageRow){

    throw new Error(
      "Image not found"
    )

  }






  await supabase
    .from("property_images")
    .update({
      is_cover: false,
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

        is_cover: true,

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
        imageRow.url,

    })
    .eq(
      "id",
      propertyId
    )





  return mapPropertyImageRow(
    data as PropertyImageRow
  )

}