import type {
  ReactNode,
} from "react"

import {
  redirect,
} from "next/navigation"

import {
  getServerUserProfile,
} from "@/lib/auth/server-user-profile"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import {
  AppHeader,
} from "@/components/app/app-header"

import {
  AppSidebar,
} from "@/components/app/app-sidebar"

import {
  DrawerProvider,
} from "@/components/providers/drawer-provider"



type AppLayoutProps = {
  children: ReactNode
}





export default async function AppLayout({
  children,
}: AppLayoutProps) {


  const user =
    await getServerUserProfile()



  if(!user){

    redirect(
      "/login"
    )

  }





  return (

    <DrawerProvider>

      <SidebarProvider defaultOpen>


        <AppSidebar

          role={
            user.role
          }


          user={{

            name:
              user.name,


            email:
              user.email ?? "",

          }}

        />



        <SidebarInset>


          <AppHeader />



          <main className="flex-1 bg-stone-50">

            {children}

          </main>


        </SidebarInset>


      </SidebarProvider>


    </DrawerProvider>

  )

}