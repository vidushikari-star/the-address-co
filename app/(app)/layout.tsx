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
  OfflineSyncProvider,
} from "@/components/providers/offline-sync-provider"

import {
  OfflineStatusProvider,
} from "@/components/providers/offline-status-provider"


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

  <OfflineStatusProvider />

  <OfflineSyncProvider />

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



          <main className="flex-1 bg-stone-50 pb-16 md:pb-0">

  {children}

</main>


<MobileBottomNav />


        </SidebarInset>


      </SidebarProvider>


    </DrawerProvider>

  )

}