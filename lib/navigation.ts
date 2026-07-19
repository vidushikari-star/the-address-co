import type { LucideIcon } from "lucide-react"

import {
  CalendarDays,
  CircleDollarSign,
  ClipboardCheck,
  ContactRound,
  FolderKanban,
  LayoutDashboard,
  Settings,
  TrendingUp,
} from "lucide-react"

export type UserRole = "admin" | "sales"

export interface NavigationItem {
  title: string
  href: string
  icon: LucideIcon
  roles: readonly UserRole[]
}

export interface NavigationGroup {
  title: string
  items: readonly NavigationItem[]
}

export const navigation: readonly NavigationGroup[] = [
  {
    title: "CRM",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        roles: ["admin", "sales"],
      },
      {
        title: "Contacts",
        href: "/contacts",
        icon: ContactRound,
        roles: ["admin", "sales"],
      },
      {
        title: "Portfolio",
        href: "/portfolio",
        icon: FolderKanban,
        roles: ["admin", "sales"],
      },
      {
        title: "Deals",
        href: "/deals",
        icon: CircleDollarSign,
        roles: ["admin", "sales"],
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        title: "Calendar",
        href: "/calendar",
        icon: CalendarDays,
        roles: ["admin", "sales"],
      },
      {
        title: "Tasks",
        href: "/tasks",
        icon: ClipboardCheck,
        roles: ["admin", "sales"],
      },
    ],
  },
  {
    title: "Administration",
    items: [
      {
        title: "Finance",
        href: "/finance",
        icon: CircleDollarSign,
        roles: ["admin"],
      },
      {
        title: "Reports",
        href: "/reports",
        icon: TrendingUp,
        roles: ["admin"],
      },
      {
        title: "Settings",
        href: "/settings",
        icon: Settings,
        roles: ["admin", "sales"],
      },
    ],
  },
]