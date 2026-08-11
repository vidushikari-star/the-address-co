"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Plus } from "lucide-react"

import { PropertyCard } from "./property-card"
import { getPropertyCardData } from "@/lib/services/property-card-service"
import type { Property } from "@/types/property"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const statuses = ["available", "viewed", "shortlisted", "offer", "purchased", "rejected", "archived"] as const
const developmentStages = ["ready_to_move", "under_construction", "resale"] as const
const furnishingTypes = ["furnished", "semi_furnished", "unfurnished"] as const

function searchValue(searchParams: URLSearchParams, key: string) {
  return searchParams.get(key) ?? ""
}

export function PropertyList() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState(() => searchValue(searchParams, "q"))
  const [status, setStatus] = useState(() => searchParams.get("status") ?? "all")
  const [transactionType, setTransactionType] = useState(() => searchParams.get("transaction") ?? "all")
  const [developmentStage, setDevelopmentStage] = useState(() => searchParams.get("construction") ?? "all")
  const [furnishing, setFurnishing] = useState(() => searchParams.get("furnishing") ?? "all")
  const [maxPrice, setMaxPrice] = useState(() => searchValue(searchParams, "max_price"))

  useEffect(() => {
    setSearch(searchValue(searchParams, "q"))
    setStatus(searchParams.get("status") ?? "all")
    setTransactionType(searchParams.get("transaction") ?? "all")
    setDevelopmentStage(searchParams.get("construction") ?? "all")
    setFurnishing(searchParams.get("furnishing") ?? "all")
    setMaxPrice(searchValue(searchParams, "max_price"))
  }, [searchParams])

  useEffect(() => {
    async function loadProperties() {
      try {
        setProperties(await getPropertyCardData())
      } catch (error) {
        console.error("Failed loading properties", error)
      } finally {
        setLoading(false)
      }
    }

    void loadProperties()
  }, [])

  const replaceQuery = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (!value || value === "all") params.delete(key)
      else params.set(key, value)
    }
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const filteredProperties = useMemo(() => properties.filter(property => {
    const searchText = search.toLowerCase()
    const matchesSearch = !searchText
      || property.name.toLowerCase().includes(searchText)
      || property.developer.toLowerCase().includes(searchText)
      || property.locality?.toLowerCase().includes(searchText)
      || property.location?.toLowerCase().includes(searchText)
    const matchesStatus = status === "all" ? property.status !== "archived" : property.status === status
    const matchesTransaction = transactionType === "all" || property.transactionType === transactionType
    const matchesConstruction = developmentStage === "all" || property.developmentStage === developmentStage
    const matchesFurnishing = furnishing === "all" || property.furnishing === furnishing
    const propertyPrice = property.transactionType === "Rental" ? property.price.rent : property.price.asking
    const matchesPrice = !maxPrice || (propertyPrice !== undefined && propertyPrice <= Number(maxPrice))
    return matchesSearch && matchesStatus && matchesTransaction && matchesConstruction && matchesFurnishing && matchesPrice
  }), [developmentStage, furnishing, maxPrice, properties, search, status, transactionType])

  const hasFilters = Boolean(search || maxPrice || status !== "all" || transactionType !== "all" || developmentStage !== "all" || furnishing !== "all")

  function clearFilters() {
    setSearch("")
    setStatus("all")
    setTransactionType("all")
    setDevelopmentStage("all")
    setFurnishing("all")
    setMaxPrice("")
    router.replace(pathname, { scroll: false })
  }

  if (loading) return <div className="rounded-2xl border p-8 text-center text-muted-foreground">Loading properties...</div>

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Properties</h1><p className="mt-1 text-sm text-muted-foreground sm:text-base">Search active inventory and match it to the right opportunity.</p></div>
        <Link href="/properties/new" className={buttonVariants({ className: "w-full sm:w-auto" })}><Plus className="mr-2 h-4 w-4" />New Property</Link>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-muted-foreground">Showing <span className="font-semibold text-foreground">{filteredProperties.length}</span> properties</p>
        {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear Filters</Button>}
      </div>

      <div className="sticky top-0 z-20 grid gap-3 rounded-2xl border bg-background/95 p-4 backdrop-blur sm:grid-cols-2 xl:grid-cols-3">
        <Input className="h-11 rounded-xl" placeholder="Search property, locality or developer..." value={search} onChange={event => { const value = event.target.value; setSearch(value); replaceQuery({ q: value }) }} />
        <Select value={status} onValueChange={value => { const next = value ?? "all"; setStatus(next); replaceQuery({ status: next }) }}><SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="CRM status" /></SelectTrigger><SelectContent><SelectItem value="all">All CRM statuses</SelectItem>{statuses.map(item => <SelectItem key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</SelectItem>)}</SelectContent></Select>
        <Select value={transactionType} onValueChange={value => { const next = value ?? "all"; setTransactionType(next); replaceQuery({ transaction: next }) }}><SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Transaction" /></SelectTrigger><SelectContent><SelectItem value="all">All transactions</SelectItem><SelectItem value="Sale">Sale</SelectItem><SelectItem value="Rental">Rent</SelectItem></SelectContent></Select>
        <Select value={developmentStage} onValueChange={value => { const next = value ?? "all"; setDevelopmentStage(next); replaceQuery({ construction: next }) }}><SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Construction / possession" /></SelectTrigger><SelectContent><SelectItem value="all">All construction statuses</SelectItem>{developmentStages.map(item => <SelectItem key={item} value={item}>{item === "ready_to_move" ? "Ready to Move" : item === "under_construction" ? "Under Construction" : "Resale"}</SelectItem>)}</SelectContent></Select>
        <Select value={furnishing} onValueChange={value => { const next = value ?? "all"; setFurnishing(next); replaceQuery({ furnishing: next }) }}><SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Furnishing" /></SelectTrigger><SelectContent><SelectItem value="all">All furnishing</SelectItem>{furnishingTypes.map(item => <SelectItem key={item} value={item}>{item === "semi_furnished" ? "Semi-furnished" : item[0].toUpperCase() + item.slice(1)}</SelectItem>)}</SelectContent></Select>
        <Input className="h-11 rounded-xl" placeholder="Maximum price (₹)" inputMode="numeric" value={maxPrice} onChange={event => { const value = event.target.value.replace(/\D/g, ""); setMaxPrice(value); replaceQuery({ max_price: value }) }} />
      </div>

      {filteredProperties.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground"><div className="space-y-3"><p className="text-base font-medium">No properties match your filters.</p><p className="text-sm text-muted-foreground">Try adjusting your search or clearing the filters.</p>{hasFilters && <Button variant="outline" onClick={clearFilters}>Clear Filters</Button>}</div></div>
      ) : <div className="space-y-5">{filteredProperties.map(property => <PropertyCard key={property.id} property={property} />)}</div>}
    </div>
  )
}
