"use client"

import Link from "next/link"

import { PUBLIC_BRAND } from "@/lib/brand/public-brand"

type AppLogoProps = {
  collapsed?: boolean
}

export function AppLogo({ collapsed = false }: AppLogoProps) {
  return (
    <Link
      href="/dashboard"
      className="flex items-center gap-3 transition-opacity hover:opacity-90"
    >

      <div className="
        flex
        h-10
        w-10
        items-center
        justify-center
        rounded-xl
        text-white
        shadow-sm
      "
        style={{ backgroundColor: PUBLIC_BRAND.primaryColor }}
      >

        <span className="
          text-lg
          font-semibold
          tracking-tight
        ">
          {PUBLIC_BRAND.mark}
        </span>

      </div>


      {!collapsed && (

        <div className="
          flex
          flex-col
          leading-none
        ">

          <span className="
            text-sm
            font-semibold
            tracking-[0.12em]
          "
            style={{ color: PUBLIC_BRAND.primaryColor }}
          >
            {PUBLIC_BRAND.name.toUpperCase()}
          </span>


          <span className="
            mt-1
            text-xs
            text-muted-foreground
          ">
            {PUBLIC_BRAND.descriptor}
          </span>

        </div>

      )}

    </Link>
  )
}
