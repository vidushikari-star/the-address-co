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


      <div className="flex h-20 items-center justify-between gap-6 px-6 lg:px-8">



        <div className="flex items-center gap-4">


          <SidebarTrigger />



          <div>


            <h2 className="text-2xl font-semibold tracking-tight">

              {greeting}, {userName}

            </h2>



            <p className="mt-1 text-sm text-muted-foreground">

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

                onClick={() => {

                  console.log("Buyer clicked")

                  openDrawer("buyer")

                }}

              >

                <UserPlus className="mr-2 h-4 w-4" />

                New Buyer

              </DropdownMenuItem>






              <DropdownMenuItem

                onClick={() => {

                  console.log("Property clicked")

                  openDrawer("property")

                }}

              >

                <Building2 className="mr-2 h-4 w-4" />

                New Property

              </DropdownMenuItem>






              <DropdownMenuItem

                onClick={() => {

                  console.log("Deal clicked")

                  openDrawer("deal")

                }}

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





        </div>



      </div>


    </header>

  )

}