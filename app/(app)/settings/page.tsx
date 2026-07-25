import {
  redirect,
} from "next/navigation"


import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"


import {
  SettingsCard,
} from "@/components/settings/settings-card"





export default async function SettingsPage(){


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
          Settings
        </h1>


        <p className="text-muted-foreground">
          Manage your workspace configuration.
        </p>

      </div>





      <div className="grid gap-6 md:grid-cols-2">


        <SettingsCard

          title="Users & Roles"

          description="Manage team members, access levels and permissions."

          href="/settings/users"

        />



        <SettingsCard

          title="Commission Settings"

          description="Configure default commission rules and splits."

          href="/settings/commission"

        />



        <SettingsCard

          title="Company Profile"

          description="Manage company information used across reports."

          href="/settings/company"

        />



        <SettingsCard

          title="Data Management"

          description="Export backups and manage your CRM data."

          href="/settings/data"

        />


      </div>


    </div>

  )

}