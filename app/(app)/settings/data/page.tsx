import {
  redirect,
} from "next/navigation"


import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"


import {
  DataManagement,
} from "@/components/settings/data-management"





export default async function DataSettingsPage(){


  const user =
    await getServerUserProfile()



  if(
    !user ||
    user.role !== "admin"
  ){

    redirect(
      "/dashboard"
    )

  }





  return (

    <div className="space-y-8 p-8">


      <div>

        <h1 className="text-3xl font-semibold">
          Data Management
        </h1>


        <p className="text-muted-foreground">
          Export and manage CRM data.
        </p>


      </div>



      <DataManagement />


    </div>

  )

}