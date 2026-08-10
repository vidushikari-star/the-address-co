import Link from "next/link"

import { cn } from "@/lib/utils"

const items = [
  ["Overview", "/marketing"],
  ["Create", "/marketing/create"],
  ["Campaigns", "/marketing/campaigns"],
  ["Calendar", "/marketing/calendar"],
  ["Approvals", "/marketing/approvals"],
  ["Content", "/marketing/content"],
  ["Templates", "/marketing/templates"],
  ["Analytics", "/marketing/analytics"],
  ["Settings", "/marketing/settings"],
] as const

export function MarketingNav({ currentPath }: { currentPath: string }) {
  return (
    <nav aria-label="Marketing navigation" className="overflow-x-auto border-b bg-card px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl gap-1">
        {items.map(([label, href]) => {
          const active = href === "/marketing"
            ? currentPath === href
            : currentPath.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "shrink-0 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                active ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
