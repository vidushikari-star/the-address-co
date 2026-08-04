import {
  NextResponse,
} from "next/server"

import {
  supabase,
} from "@/lib/supabase/client"



export async function POST(
  request: Request
){

  try {


    const authHeader =
      request.headers.get(
        "authorization"
      )


    const token =
      authHeader?.replace(
        "Bearer ",
        ""
      )



    if(
      !token ||
      token !== process.env.HOUSING_PUSH_API_KEY
    ){

      return NextResponse.json(
        {
          error:
            "Unauthorized",
        },
        {
          status:401,
        }
      )

    }





    const body =
      await request.json()





    if(
      !body.property_id
    ){

      return NextResponse.json(
        {
          error:
            "Property ID required",
        },
        {
          status:400,
        }
      )

    }





    const {
  data: property,
  error: propertyError,
} =
await supabase
  .from("properties")
  .select(
    "id,housing_listing_id"
  )
  .eq(
    "id",
    body.property_id
  )
  .single()



    if(
      propertyError ||
      !property
    ){

      return NextResponse.json(
        {
          error:
            "Property not found",
        },
        {
          status:404,
        }
      )

    }





    /*
      TEMPORARY:
      Replace this with actual Housing API response
      once Housing provides push endpoint.
    */

    const housingListingId =
  property.housing_listing_id
  ??
  `housing_${Date.now()}`





    const {
      error,
    } =
    await supabase
      .from("properties")
      .update({

        housing_listing_id:
          housingListingId,


        housing_sync_status:
          "synced",


        housing_last_synced_at:
          new Date()
            .toISOString(),


        housing_sync_error:
          null,

      })
      .eq(
        "id",
        body.property_id
      )





    if(error){

      throw error

    }





    return NextResponse.json({

      success:true,


      property_id:
        body.property_id,


      housing_listing_id:
        housingListingId,


      status:
        "synced",

    })



  }
  catch(error){


    console.error(
      "Housing push failed",
      error
    )


    return NextResponse.json(
      {
        error:
          "Internal server error",
      },
      {
        status:500,
      }
    )

  }

}