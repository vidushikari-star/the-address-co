"use client"


export function DataManagement(){


  function exportData(
  type:string
){

  const routes:Record<string,string> = {

    "Contacts":
      "/api/export/contacts",

    "Properties":
      "/api/export/properties",

    "Full Backup":
      "/api/export/backup",

    "Deals":
      "/api/reports/sales/export",

    "Commissions":
      "/api/reports/commission/export",

  }



  const route =
    routes[type]



  if(route){

    window.location.href =
      route

    return

  }


}





  const exports = [

    {
      title:
        "Export Contacts",

      description:
        "Download all client and lead records.",

      type:
        "Contacts",
    },


    {
      title:
        "Export Properties",

      description:
        "Download property inventory.",

      type:
        "Properties",
    },


    {
      title:
        "Export Deals",

      description:
        "Download sales pipeline data.",

      type:
        "Deals",
    },


    {
      title:
        "Export Commissions",

      description:
        "Download commission records.",

      type:
        "Commissions",
    },


    {
      title:
        "Full CRM Backup",

      description:
        "Download complete CRM data backup including contacts, properties, deals, commissions and settings.",

      type:
        "Full Backup",
    },


  ]





  return (

    <div className="grid gap-6 md:grid-cols-2">


      {
        exports.map(

          item => (

            <div

              key={
                item.type
              }

              className="rounded-2xl border p-6"

            >

              <h3 className="font-semibold">

                {
                  item.title
                }

              </h3>


              <p className="mt-2 text-sm text-muted-foreground">

                {
                  item.description
                }

              </p>



              <button

                onClick={
                  () =>
                    exportData(
                      item.type
                    )
                }

                className="mt-5 rounded-md bg-primary px-4 py-2 text-sm text-white"

              >

                Export Excel

              </button>


            </div>

          )

        )

      }


    </div>

  )

}