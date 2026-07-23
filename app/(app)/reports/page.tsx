import {
  redirect,
} from "next/navigation"

import {
  getCurrentUser,
} from "@/lib/auth/current-user"



export default async function Page() {


  const user =
    await getCurrentUser()



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