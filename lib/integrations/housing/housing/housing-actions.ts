"use server"

import type {
  Property,
} from "@/types/property"



export async function pushPropertyToHousing(
  property: Property
){

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL



  if(!baseUrl){

    throw new Error(
      "Application URL missing"
    )

  }



  const response =
    await fetch(
      `${baseUrl}/api/integrations/housing/listings`,
      {
        method:"POST",

        headers:{

          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${process.env.HOUSING_PUSH_API_KEY}`,

        },


       body:
  JSON.stringify({

    property_id:
      property.id,

    name:
      property.name,


            slug:
              property.slug,


            developer:
              property.developer,


            transaction_type:
              property.transactionType,


            listing_type:
              property.listingType,


            property_type:
              property.propertyType,


            development_stage:
              property.developmentStage,


            location:
              property.location,


            locality:
              property.locality,


            description:
              property.description,


            bedrooms:
              property.specifications.bedrooms,


            bathrooms:
              property.specifications.bathrooms,


            carpet_area:
              property.specifications.carpetArea,


            built_up_area:
              property.specifications.builtUpArea,


            plot_area:
              property.specifications.plotArea,


            price:
              property.price,


            cover_image:
              property.coverImage,

          })

      }
    )



  const data =
    await response.json()



  if(!response.ok){

    throw new Error(
      data.error ??
      "Housing push failed"
    )

  }



  return data

}