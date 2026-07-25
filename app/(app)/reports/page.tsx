import {
  redirect,
} from "next/navigation"

import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"



export default async function Page() {


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

    <div className="p-8 text-2xl font-semibold">

      Coming Soon

    </div>

  )

}