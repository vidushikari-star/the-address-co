"use client"

import { Bell, Plus, Search } from "lucide-react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

function getGreeting() {
  const hour = new Date().getHours()

  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"

  return "Good evening"
}

export function AppHeader() {
  const today = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date())

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">
      <div className="flex h-20 items-center justify-between px-6 lg:px-8">
        {/* Left */}
        <div className="flex items-center gap-4">
          <SidebarTrigger />

          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {getGreeting()}, Vidushi
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              {today}
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div className="relative hidden lg:block">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              placeholder="Search people, properties, deals..."
              className="h-11 w-96 rounded-full border-border/60 bg-background pl-11 shadow-none"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-full"
          >
            <Plus className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 rounded-full"
          >
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}