import Link from "next/link"
import { Search } from "lucide-react"

export function PortfolioToolbar() {
  return (
    <div
      className="
        mb-6
        flex
        flex-col
        gap-3
        sm:flex-row
        sm:items-center
        sm:justify-between
      "
    >

      <div className="relative w-full sm:max-w-md">

        <Search
          className="
            absolute
            left-3
            top-1/2
            h-4
            w-4
            -translate-y-1/2
            text-muted-foreground
          "
        />


        <input

          placeholder="Search properties..."

          className="
            h-11
            w-full
            rounded-2xl
            border
            border-border
            bg-background
            pl-10
            pr-4
            text-sm
            outline-none
            transition-colors
            focus:border-primary
          "

        />

      </div>





      <Link

        href="/properties/new"

        className="
          flex
          h-11
          w-full
          items-center
          justify-center
          rounded-2xl
          bg-primary
          px-5
          text-sm
          font-medium
          text-primary-foreground
          transition-colors
          hover:opacity-90
          sm:w-auto
        "

      >

        New Property

      </Link>


    </div>
  )
}