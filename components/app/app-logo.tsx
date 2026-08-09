"use client"

import Link from "next/link"

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
        bg-[#1F4D3B]
        text-white
        shadow-sm
      ">

        <span className="
          text-lg
          font-semibold
          tracking-tight
        ">
          A
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
            text-[#1F4D3B]
          ">
            THE ADDRESS CO.
          </span>


          <span className="
            mt-1
            text-xs
            text-muted-foreground
          ">
            Luxury Real Estate Advisory
          </span>

        </div>

      )}

    </Link>
  )
}
