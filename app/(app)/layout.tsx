import type { ReactNode } from "react"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { AppHeader } from "@/components/app/app-header"
import { AppSidebar } from "@/components/app/app-sidebar"
import { DrawerProvider } from "@/components/providers/drawer-provider"

type AppLayoutProps = {
  children: ReactNode
}

export default function AppLayout({
  children,
}: AppLayoutProps) {
  return (
    <DrawerProvider>
      <SidebarProvider defaultOpen>
        <AppSidebar
          role="admin"
          user={{
            name: "Vidushi Kari",
            email: "vidushi@theaddressco.in",
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