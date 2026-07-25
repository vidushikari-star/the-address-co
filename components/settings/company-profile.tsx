"use client"

import {
  useEffect,
  useState,
} from "react"


import {
  getCompanySettings,
  updateCompanySetting,
} from "@/lib/repositories/company-settings-repository"





const fields = [

  {
    key:"company_name",
    label:"Company Name",
  },

  {
    key:"company_email",
    label:"Email",
  },

  {
    key:"company_phone",
    label:"Phone",
  },

  {
    key:"company_address",
    label:"Address",
  },

]







export function CompanyProfile(){


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
      const field of fields
    ){

      await updateCompanySetting(

        field.key,

        settings[field.key] ?? ""

      )

    }


    alert(
      "Company profile saved"
    )

  }







  return (

    <div className="space-y-6">


      <div className="rounded-2xl border p-6">


        <h2 className="mb-5 font-semibold">
          Company Information
        </h2>




        <div className="space-y-4">


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


                {
                  field.key === "company_address"
                  ?

                  <textarea

                    className="mt-2 w-full rounded-lg border p-3"

                    rows={4}

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

                  :

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

                }


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

        Save Company Profile

      </button>


    </div>

  )

}