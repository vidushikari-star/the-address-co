"use client"

import Link from "next/link"

import {
  usePathname,
} from "next/navigation"

import {
  LayoutDashboard,
  ContactRound,
  FolderKanban,
  CircleDollarSign,
  Menu,
} from "lucide-react"



const items = [

  {
    title:"Home",
    href:"/dashboard",
    icon:LayoutDashboard,
  },

  {
    title:"Contacts",
    href:"/contacts",
    icon:ContactRound,
  },

  {
    title:"Properties",
    href:"/properties",
    icon:FolderKanban,
  },

  {
    title:"Deals",
    href:"/deals",
    icon:CircleDollarSign,
  },

  {
    title:"More",
    href:"/settings",
    icon:Menu,
  },

]





export function MobileBottomNav(){


  const pathname =
    usePathname()





  return (

    <nav

      className="
        fixed
        bottom-0
        left-0
        right-0
        z-50
        border-t
        bg-background/95
        backdrop-blur
        md:hidden
        pb-[env(safe-area-inset-bottom)]
      "

    >


      <div

        className="
          grid
          h-16
          grid-cols-5
        "

      >


        {
          items.map(

            item => {


              const Icon =
                item.icon



              const active =
                pathname === item.href
                ||
                pathname.startsWith(
                  item.href + "/"
                )





              return (

                <Link

                  key={
                    item.href
                  }

                  href={
                    item.href
                  }

                  className={`
                    flex
                    min-h-[44px]
                    flex-col
                    items-center
                    justify-center
                    gap-1
                    text-xs
                    transition
                    ${
                      active
                      ? "text-primary"
                      : "text-muted-foreground"
                    }
                  `}

                >

                  <Icon

                    className="
                      h-5
                      w-5
                    "

                  />


                  <span>

                    {item.title}

                  </span>


                </Link>

              )

            }

          )

        }


      </div>


    </nav>

  )

}