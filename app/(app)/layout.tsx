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
  MobileBottomNav,
} from "@/components/app/mobile-bottom-nav"

import {
  AppSidebar,
} from "@/components/app/app-sidebar"

import {
  DrawerProvider,
} from "@/components/providers/drawer-provider"

import {
  GlobalSearch,
} from "@/components/layout/global-search"





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


          <div
            className="
              border-b
              bg-background
              px-4
              py-3
              md:px-6
            "
          >

            <GlobalSearch />

          </div>



          <main className="
            flex-1
            bg-stone-50
            pb-16
            md:pb-0
          ">

            {children}

          </main>



          <MobileBottomNav />


        </SidebarInset>


      </SidebarProvider>


    </DrawerProvider>

  )

}