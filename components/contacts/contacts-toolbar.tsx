import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"

export function ContactsToolbar() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-card p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          placeholder="Search people..."
          className="pl-10"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          "All",
          "Buyer",
          "Seller",
          "Developer",
          "Broker",
          "Investor",
        ].map((filter) => (
          <button
            key={filter}
            className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
          >
            {filter}
          </button>
        ))}
      </div>
    </div>
  )
}