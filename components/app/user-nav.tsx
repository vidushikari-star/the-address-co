"use client"

import {
  ChevronsUpDown,
  LogOut,
  Settings,
  User,
} from "lucide-react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type { UserRole } from "@/lib/navigation"

interface UserNavProps {
  name: string
  email: string
  role?: UserRole
  image?: string
}

const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  sales: "Sales Consultant",
}

export function UserNav({
  name,
  email,
  role = "admin",
  image,
}: UserNavProps) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl border border-border bg-background px-3 py-2 text-left transition-colors hover:bg-muted">
        <Avatar>
          {image ? (
            <AvatarImage
              src={image}
              alt={name}
            />
          ) : null}

          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">
            {name}
          </span>

          <span className="truncate text-xs text-muted-foreground">
            {roleLabels[role]}
          </span>
        </div>

        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="font-medium">
                {name}
              </span>

              <span className="text-xs text-muted-foreground">
                {email}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>

        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}