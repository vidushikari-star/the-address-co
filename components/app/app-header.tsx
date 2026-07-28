"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  Bell,
  Plus,
  UserPlus,
  Building2,
  Handshake,
  LogOut,
  UserCircle,
} from "lucide-react"


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


import {
  SidebarTrigger,
} from "@/components/ui/sidebar"


import {
  Button,
} from "@/components/ui/button"


import {
  useDrawer,
} from "@/components/providers/drawer-provider"


import {
  getCurrentUserProfile,
} from "@/lib/auth/user-profile"


import {
  supabase,
} from "@/lib/supabase/client"


import {
  useRouter,
} from "next/navigation"





function getGreeting(){

  const hour =
    new Date().getHours()


  if(hour < 12)
    return "Good morning"


  if(hour < 18)
    return "Good afternoon"


  return "Good evening"

}





export function AppHeader(){


  const {
    openDrawer,
  } = useDrawer()



  const router =
    useRouter()



  const [
    greeting,
    setGreeting,
  ] =
  useState("")



  const [
    today,
    setToday,
  ] =
  useState("")



  const [
    userName,
    setUserName,
  ] =
  useState("User")







  async function logout(){

    await supabase.auth.signOut()

    router.push("/login")

    router.refresh()

  }







  useEffect(()=>{


    setGreeting(
      getGreeting()
    )



    setToday(

      new Intl.DateTimeFormat(
        "en-IN",
        {
          weekday:"long",
          day:"numeric",
          month:"long",
        }
      ).format(
        new Date()
      )

    )





    async function loadUser(){

      const user =
        await getCurrentUserProfile()


      if(user){

        setUserName(
          user.name.split(" ")[0]
        )

      }

    }



    loadUser()


  },[])








  return (

    <header className="
      sticky
      top-0
      z-40
      border-b
      border-border/60
      bg-background/90
      backdrop-blur-xl
    ">


      <div className="
        flex
        h-16
        items-center
        justify-between
        px-4
        lg:h-20
        lg:px-8
      ">





        <div className="
          flex
          items-center
          gap-3
        ">


          <SidebarTrigger />



          <div>


            <h2 className="
              text-sm
              font-semibold
              lg:text-xl
            ">


              {greeting},{" "}

              <span>
                {userName}
              </span>


            </h2>



            <p className="
              hidden
              text-xs
              text-muted-foreground
              sm:block
            ">

              {today}

            </p>


          </div>


        </div>







        <div className="
          flex
          items-center
          gap-2
        ">





          <DropdownMenu>


            <DropdownMenuTrigger

              className="
                flex
                h-10
                items-center
                gap-2
                rounded-full
                border
                px-4
                text-sm
                hover:bg-muted
              "

            >

              <Plus className="h-4 w-4"/>


              <span className="hidden lg:inline">
                New
              </span>


            </DropdownMenuTrigger>





            <DropdownMenuContent
              align="end"
              className="w-56"
            >


              <DropdownMenuItem

                onClick={() =>
                  router.push("/contacts/new")
                }

              >

                <UserPlus className="mr-2 h-4 w-4"/>

                New Relationship

              </DropdownMenuItem>





              <DropdownMenuItem

                onClick={() =>
                  openDrawer("property")
                }

              >

                <Building2 className="mr-2 h-4 w-4"/>

                New Property

              </DropdownMenuItem>





              <DropdownMenuItem

                onClick={() =>
                  openDrawer("deal")
                }

              >

                <Handshake className="mr-2 h-4 w-4"/>

                New Deal

              </DropdownMenuItem>


            </DropdownMenuContent>


          </DropdownMenu>







          <Button

            variant="outline"

            size="icon"

            className="
              hidden
              h-10
              rounded-full
              sm:flex
            "

          >

            <Bell className="h-5 w-5"/>

          </Button>







          <DropdownMenu>


            <DropdownMenuTrigger

              className="
                flex
                h-10
                items-center
                gap-2
                rounded-full
                border
                px-3
                text-sm
                hover:bg-muted
              "

            >

              <UserCircle className="h-5 w-5"/>


              <span className="hidden sm:inline">
                {userName}
              </span>


            </DropdownMenuTrigger>





            <DropdownMenuContent
              align="end"
              className="w-40"
            >


              <DropdownMenuItem

                onClick={logout}

              >

                <LogOut className="mr-2 h-4 w-4"/>

                Logout


              </DropdownMenuItem>


            </DropdownMenuContent>


          </DropdownMenu>





        </div>


      </div>


    </header>

  )

}