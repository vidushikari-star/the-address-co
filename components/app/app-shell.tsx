"use client"

import type {
  ReactNode,
} from "react"


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


import type {
  UserProfile,
} from "@/types/user"



type Props = {

  children:ReactNode

  user:UserProfile | null

}





export function AppShell({
  children,
  user,
}:Props){


  return (

    <DrawerProvider>


      <SidebarProvider defaultOpen>


        <AppSidebar

          role={
            user?.role
          }


          user={

            user
              ? {

                  name:
                    user.name,

                  email:
                    user.email ?? "",

                }

              : undefined

          }

        />



        <SidebarInset>


          <AppHeader />



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