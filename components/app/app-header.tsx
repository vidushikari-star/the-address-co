"use client"

import {
  useEffect,
  useState,
} from "react"

import {
  Bell,
  Plus,
  Search,
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
  Input,
} from "@/components/ui/input"

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





function getGreeting() {

  const hour =
    new Date().getHours()


  if(hour < 12)
    return "Good morning"


  if(hour < 18)
    return "Good afternoon"


  return "Good evening"

}







export function AppHeader() {


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







  useEffect(() => {


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



  }, [])







  return (

    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/90 backdrop-blur-xl">


      <div className="flex h-24 items-center justify-between gap-6 px-6 lg:px-8">



        <div className="flex items-center gap-4">


          <SidebarTrigger />



          <div>

            <h2 className="text-xl font-semibold tracking-tight">

              {greeting}, {userName}

            </h2>



            <p className="text-xs text-muted-foreground">

              {today}

            </p>


          </div>


        </div>







        <div className="hidden flex-1 justify-center lg:flex">


          <div className="relative w-full max-w-xl">


            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />



            <Input

              placeholder="Search (coming soon)..."

              className="h-11 rounded-full pl-11"

            />


          </div>


        </div>







        <div className="flex items-center gap-3">



          <DropdownMenu>


            <DropdownMenuTrigger

              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"

            >

              <Plus className="h-4 w-4" />

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

  <UserPlus className="mr-2 h-4 w-4" />

  New Relationship

</DropdownMenuItem>





              <DropdownMenuItem

                onClick={() => openDrawer("property")}

              >

                <Building2 className="mr-2 h-4 w-4" />

                New Property

              </DropdownMenuItem>





              <DropdownMenuItem

                onClick={() => openDrawer("deal")}

              >

                <Handshake className="mr-2 h-4 w-4" />

                New Deal

              </DropdownMenuItem>


            </DropdownMenuContent>


          </DropdownMenu>







          <Button

            variant="outline"

            size="icon"

            className="h-11 rounded-full"

          >

            <Bell className="h-5 w-5" />

          </Button>







          <DropdownMenu>


            <DropdownMenuTrigger

              className="flex h-11 items-center gap-2 rounded-full border px-4 text-sm"

            >

              <UserCircle className="h-5 w-5" />

              {userName}


            </DropdownMenuTrigger>




            <DropdownMenuContent

              align="end"

              className="w-40"

            >


              <DropdownMenuItem

                onClick={logout}

              >

                <LogOut className="mr-2 h-4 w-4" />

                Logout


              </DropdownMenuItem>


            </DropdownMenuContent>


          </DropdownMenu>





        </div>



      </div>


    </header>

  )

}