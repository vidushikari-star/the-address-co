"use client"

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import { BuyerDrawer } from "@/components/forms/buyer-drawer"

type DrawerType = "buyer" | "property" | "deal" | null

type DrawerContextType = {
  openDrawer: (drawer: Exclude<DrawerType, null>) => void
  closeDrawer: () => void
}

const DrawerContext = createContext<DrawerContextType | null>(null)

export function DrawerProvider({
  children,
}: {
  children: ReactNode
}) {
  const [drawer, setDrawer] = useState<DrawerType>(null)

  const value = useMemo(
    () => ({
      openDrawer: (drawer: Exclude<DrawerType, null>) => {
        setDrawer(drawer)
      },
      closeDrawer: () => {
        setDrawer(null)
      },
    }),
    []
  )

  return (
    <DrawerContext.Provider value={value}>
      {children}

      <BuyerDrawer
        open={drawer === "buyer"}
        onOpenChange={(open) => {
          if (!open) {
            setDrawer(null)
          }
        }}
      />

      {/* PropertyDrawer coming soon */}

      {/* DealDrawer coming soon */}
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