import {
  redirect,
} from "next/navigation"


import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"


import {
  CompanyProfile,
} from "@/components/settings/company-profile"





export default async function CompanySettingsPage(){


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
          Company Profile
        </h1>


        <p className="text-muted-foreground">
          Manage company details used across the CRM.
        </p>

      </div>



      <CompanyProfile />


    </div>

  )

}