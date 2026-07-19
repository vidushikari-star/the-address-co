import type { ReactNode } from "react"

import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"

import { AppHeader } from "@/components/app/app-header"
import { AppSidebar } from "@/components/app/app-sidebar"

type AppLayoutProps = {
  children: ReactNode
}

export default function AppLayout({
  children,
}: AppLayoutProps) {
  return (
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
  )
}