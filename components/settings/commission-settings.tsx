"use client"

import {
  useEffect,
  useState,
} from "react"


import {
  getCompanySettings,
  updateCompanySetting,
} from "@/lib/repositories/company-settings-repository"





const fields:{
  key:string
  label:string
}[] = [

  {
    key:
      "sale_commission_percent",

    label:
      "Sale Commission %",
  },


  {
    key:
      "rental_commission_percent",

    label:
      "Rental Commission %",
  },


  {
    key:
      "client_source_split",

    label:
      "Client Source Split %",
  },


  {
    key:
      "inventory_source_split",

    label:
      "Inventory Source Split %",
  },


  {
    key:
      "partner_split",

    label:
      "Partner Split %",
  },


  {
    key:
      "sales_split",

    label:
      "Sales Split %",
  },

]







export function CommissionSettings(){


  const [
    settings,
    setSettings,
  ] =
  useState<Record<string,string>>({})





  useEffect(()=>{


    async function load(){


      const data =
        await getCompanySettings()


      setSettings(
        data
      )


    }


    load()


  },[])







  function update(

    key:string,

    value:string

  ){

    setSettings(
      current => ({

        ...current,

        [key]:
          value,

      })
    )

  }







  async function save(){


    for(
      const item of fields
    ){

      await updateCompanySetting(

        item.key,

        settings[item.key] ?? ""

      )

    }


    alert(
      "Settings saved"
    )


  }







  return (

    <div className="space-y-6">


      <div className="rounded-2xl border p-6">


        <h2 className="mb-5 font-semibold">
          Commission Defaults
        </h2>




        <div className="grid gap-4 md:grid-cols-2">


          {
            fields.map(
              field => (


                <div
                  key={
                    field.key
                  }
                >

                  <label className="text-sm">

                    {
                      field.label
                    }

                  </label>



                  <input

                    className="mt-2 w-full rounded-lg border p-3"

                    value={
                      settings[field.key] ?? ""
                    }

                    onChange={
                      e =>
                        update(
                          field.key,
                          e.target.value
                        )
                    }

                  />


                </div>


              )
            )
          }


        </div>


      </div>





      <button

        onClick={
          save
        }

        className="rounded-md bg-primary px-5 py-2 text-sm text-white"

      >

        Save Settings

      </button>


    </div>

  )

}