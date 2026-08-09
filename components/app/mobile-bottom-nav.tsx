"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  CircleDollarSign,
  ContactRound,
  FolderKanban,
  LayoutDashboard,
  Menu,
} from "lucide-react"

import { useSidebar } from "@/components/ui/sidebar"

const primaryItems = [
  {
    title: "Home",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Contacts",
    href: "/contacts",
    icon: ContactRound,
  },
  {
    title: "Properties",
    href: "/properties",
    icon: FolderKanban,
  },
  {
    title: "Deals",
    href: "/deals",
    icon: CircleDollarSign,
  },
]

function isCurrentRoute(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function MobileBottomNav() {
  const pathname = usePathname()
  const { setOpenMobile } = useSidebar()

  const isPrimaryRoute = primaryItems.some(item =>
    isCurrentRoute(pathname, item.href)
  )

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {primaryItems.map(item => {
          const Icon = item.icon
          const active = isCurrentRoute(pathname, item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[44px] flex-col items-center justify-center gap-1 text-xs transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          )
        })}

        <button
          type="button"
          onClick={() => setOpenMobile(true)}
          aria-label="Open navigation menu"
          aria-current={!isPrimaryRoute ? "page" : undefined}
          className={`flex min-h-[44px] flex-col items-center justify-center gap-1 text-xs transition-col ${
            !isPrimaryRoute
              ? "text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Menu className="h-5 w-5" />
          <span>More</span>
        </button>
      </div>
    </nav>
  )
}
