import {
  redirect,
} from "next/navigation"


import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"


import { createServerSupabaseClient } from "@/lib/supabase/server"
import { createAuthenticatedCrmReadRepository } from "@/lib/repositories/authenticated-crm-read-repository"


import {
  UserManagement,
} from "@/components/settings/user-management"





export default async function UsersSettingsPage(){


  const user =
    await getServerUserProfile()

  const crm = createAuthenticatedCrmReadRepository(await createServerSupabaseClient())



  if(
    !user ||
    user.role !== "admin"
  ){

    redirect(
      "/dashboard"
    )

  }





  const users =
    await crm.getUserProfiles()





  return (

    <div className="space-y-8 p-8">


      <div>

        <h1 className="text-3xl font-semibold">
          Users & Roles
        </h1>


        <p className="text-muted-foreground">
          Manage team members and access levels.
        </p>

      </div>





      <UserManagement

        users={
          users
        }

      />


    </div>

  )

}
