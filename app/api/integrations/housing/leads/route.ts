import {
  NextResponse,
} from "next/server"

import {
  ContactsServerRepository,
} from "@/lib/supabase/repositories/contacts-server.repository"

import {
  createActivity,
} from "@/lib/repositories/activity-repository"

import {
  normalizePhone,
} from "@/lib/utils/phone"



export async function POST(
  request: Request
){

  try {


    const body =
      await request.json()



    console.log(
      "Housing Lead Received:",
      body
    )



    if(
      !body.lead_phone
    ){

      return NextResponse.json(
        {
          success:false,
          message:"Phone number missing",
        },
        {
          status:400,
        }
      )

    }





    const phone =
      normalizePhone(
        `${body.country_code ?? ""}${body.lead_phone}`
      )





    const existing =
      await ContactsServerRepository.findByPhone(
        phone
      )





    const name =
      (
        body.lead_name ??
        ""
      )
      .trim()



    const parts =
      name.split(" ")



    const firstName =
      parts.shift()
      ||
      "Unknown"



    const lastName =
      parts.length
        ? parts.join(" ")
        : undefined





    const payload = {

      firstName,

      lastName,

      phone,

      email:
        body.lead_email
        ||
        undefined,


      city:
        body.city_name,


      country:
        "India",


      leadSource:
        "Housing.com",


      housingLeadId:
        String(
          body.flat_id
        ),


      budgetMin:
        body.min_price,


      budgetMax:
        body.max_price,


      locations:
        body.locality_name
          ? [
              body.locality_name,
            ]
          : [],


      propertyType:
        undefined,

    }





    let contact





    if(existing){

      contact =
        await ContactsServerRepository.update(
          existing.id,
          payload
        )

    }
    else{

      contact =
        await ContactsServerRepository.create(
          payload
        )

    }





    





    await createActivity({

      contactId:
        contact.id,


      type:
        "contact_created",


      title:
        existing
          ? "Updated Housing.com enquiry"
          : "New Housing.com enquiry",


      description:
        "Lead received through Housing.com push integration"

    })





    return NextResponse.json({

      success:true,

      message:
        "Lead received successfully"

    })



  }
  catch(error){


    console.error(
      "Housing webhook error:",
      error
    )


    return NextResponse.json(

      {
        success:false,
        message:"Unable to process lead",
      },

      {
        status:500,
      }

    )

  }

}