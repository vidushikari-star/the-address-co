"use client"

import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ContactToolbarProps = {
  query: string
  onQueryChange: (value: string) => void
  typeFilter: string
  onTypeFilterChange: (value: string) => void
}

export function ContactToolbar({
  query,
  onQueryChange,
  typeFilter,
  onTypeFilterChange,
}: ContactToolbarProps) {
  const hasFilters = query !== "" || typeFilter !== "all"

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="relative w-full lg:max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search contacts..."
          className="pl-10"
        />
      </div>

      <div className="flex items-center gap-3">
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            onTypeFilterChange(value ?? "all")
          }}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Contact Type" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="all">All Contacts</SelectItem>
            <SelectItem value="buyer">Buyers</SelectItem>
            <SelectItem value="seller">Sellers</SelectItem>
            <SelectItem value="investor">Investors</SelectItem>
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              onQueryChange("")
              onTypeFilterChange("all")
            }}
          >
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}