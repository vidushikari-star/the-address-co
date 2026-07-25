import {
  createServerSupabaseClient,
} from "@/lib/supabase/server"





export async function getCompanySettings()
:Promise<Record<string,string>>{


  const supabase =
    await createServerSupabaseClient()



  const {
    data,
    error,
  } =
  await supabase
    .from(
      "company_settings"
    )
    .select(
      "key,value"
    )



  if(error){

    throw error

  }





  return Object.fromEntries(

    (data ?? [])
      .map(
        item => [

          item.key,

          item.value ?? "",

        ]
      )

  )


}







export async function updateCompanySetting(
  key:string,
  value:string
){


  const supabase =
    await createServerSupabaseClient()



  const {
    error,
  } =
  await supabase
    .from(
      "company_settings"
    )
    .upsert(

      {

        key,

        value,

        updated_at:
          new Date()
          .toISOString(),

      },

      {
        onConflict:
          "key",
      }

    )



  if(error){

    throw error

  }


}