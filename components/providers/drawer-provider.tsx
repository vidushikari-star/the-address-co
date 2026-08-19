"use client"

import {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { BuyerDrawer } from "@/components/forms/buyer-drawer"
import { PropertyDrawer } from "@/components/forms/property-drawer"
import { DealDrawer } from "@/components/forms/deal-drawer"
import { RelationshipDrawer } from "@/components/forms/relationship-drawer"

type DrawerType = "buyer" | "relationship" | "property" | "deal" | null

type DrawerContextType = {
  openDrawer: (drawer: Exclude<DrawerType, null>) => void
  closeDrawer: () => void
}

const DrawerContext = createContext<DrawerContextType | null>(null)

function isDashboardDrawer(value: string | null): value is Exclude<DrawerType, null> {
  return value === "relationship" || value === "property" || value === "deal"
}

export function DrawerProvider({
  children,
}: {
  children: ReactNode
}) {
  const [drawer, setDrawer] = useState<DrawerType>(null)
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedDrawer = pathname === "/dashboard" ? searchParams.get("new") : null

  const closeDrawer = useCallback(() => {
    setDrawer(null)

    if (requestedDrawer) {
      router.replace(pathname)
    }
  }, [pathname, requestedDrawer, router])

  useEffect(() => {
    if (isDashboardDrawer(requestedDrawer)) {
      setDrawer(requestedDrawer)
    }
  }, [requestedDrawer])

  const value = useMemo(
    () => ({
      openDrawer: (drawer: Exclude<DrawerType, null>) => {
        setDrawer(drawer)
      },
      closeDrawer,
    }),
    [closeDrawer]
  )

  return (
    <DrawerContext.Provider value={value}>
      {children}

<BuyerDrawer
  open={drawer === "buyer"}
  onOpenChange={(open) => {
    if (!open) {
      closeDrawer()
    }
  }}
/>

<RelationshipDrawer
  open={drawer === "relationship"}
  onOpenChange={(open) => {
    if (!open) {
      closeDrawer()
    }
  }}
/>

<PropertyDrawer
  open={drawer === "property"}
  onOpenChange={(open) => {
    if (!open) {
      closeDrawer()
    }
  }}
/>

<DealDrawer
  open={drawer === "deal"}
  onOpenChange={(open) => {
    if (!open) {
      closeDrawer()
    }
  }}
/>
    </DrawerContext.Provider>
  )
}

export function useDrawer() {
  const context = useContext(DrawerContext)

  if (!context) {
    throw new Error(
      "useDrawer must be used within DrawerProvider"
    )
  }

  return context
}
