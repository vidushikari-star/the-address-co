import { supabase } from "@/lib/supabase/client"


export const PropertiesRepository = {


  async getAll() {


    const {
      data,
      error,
    } =
      await supabase
        .from("properties")
        .select(`
          id,
          name,
          location,
          locality,
          property_type,
          bedrooms,
          cover_image,
          public_link,
          price
        `)
        .order(
          "created_at",
          {
            ascending: false,
          }
        )



    if(error){

      throw error

    }



    return data ?? []


  }





}