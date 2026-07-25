import {
  redirect,
} from "next/navigation"


import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"


import {
  CommissionSettings,
} from "@/components/settings/commission-settings"





export default async function CommissionSettingsPage(){


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
          Commission Settings
        </h1>


        <p className="text-muted-foreground">
          Configure default commission and split rules.
        </p>

      </div>


      <CommissionSettings />


    </div>

  )

}