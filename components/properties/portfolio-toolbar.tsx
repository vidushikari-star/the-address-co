import Link from "next/link"
import { Search } from "lucide-react"

export function PortfolioToolbar() {
  return (
    <div className="mb-8 flex items-center justify-between">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <input
          placeholder="Search properties..."
          className="h-11 w-full rounded-2xl border border-border bg-background pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
        />
      </div>

      <Link
        href="/properties/new"
        className="rounded-2xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
      >
        New Property
      </Link>
    </div>
  )
}