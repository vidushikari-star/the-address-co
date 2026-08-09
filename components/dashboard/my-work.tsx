"use client"

import {
Users,
BriefcaseBusiness,
MapPin,
ClipboardList,
CalendarCheck,
ArrowRight,
} from "lucide-react"

import Link from "next/link"

import {
DashboardCard,
DashboardCardContent,
DashboardCardHeader,
} from "@/components/ui/dashboard-card"


type MyWorkProps = {
data: {
  newLeads: number
  followUps: number
  myTasks: number
  activeDeals: number
  upcomingVisits: number
}
}



export function MyWork({
data,
}: MyWorkProps) {


const items = [

{
  label: "New Leads",
  value: data.newLeads,
  icon: Users,
  href: "/contacts?stage=new",
},


{
  label: "Follow Ups",
  value: data.followUps,
  icon: CalendarCheck,
  href: "/contacts",
},


{
  label: "Tasks",
  value: data.myTasks,
  icon: ClipboardList,
  href: "/tasks",
},


{
  label: "Active Deals",
  value: data.activeDeals,
  icon: BriefcaseBusiness,
  href: "/deals",
},


{
  label: "Upcoming Visits",
  value: data.upcomingVisits,
  icon: MapPin,
  href: "/calendar",
},

]



return (

<DashboardCard>


  <DashboardCardHeader>

    <div>

      <p className="
        text-sm
        text-muted-foreground
      ">

        My Work

      </p>


      <h3 className="
        mt-2
        text-2xl
        font-semibold
      ">

        Today&apos;s Priorities

      </h3>


    </div>


  </DashboardCardHeader>





  <DashboardCardContent>



    {/* MOBILE */}

    <div className="
      space-y-3
      md:hidden
    ">


      {
        items.map(
          item => {

            const Icon =
              item.icon


            return (

              <Link

                key={
                  item.label
                }

                href={
                  item.href
                }

                className="
                  flex
                  items-center
                  justify-between
                  rounded-xl
                  border
                  p-4
                  transition
                  active:scale-[0.98]
                "

              >


                <div className="
                  flex
                  items-center
                  gap-4
                ">


                  <div className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-full
                    bg-muted
                  ">


                    <Icon className="
                      h-5
                      w-5
                      text-muted-foreground
                    "/>


                  </div>




                  <div>


                    <p className="
                      text-sm
                      text-muted-foreground
                    ">

                      {item.label}

                    </p>



                    <p className="
                      text-xl
                      font-semibold
                    ">

                      {item.value}

                    </p>


                  </div>


                </div>




                <ArrowRight className="
                  h-4
                  w-4
                  text-muted-foreground
                "/>


              </Link>

            )

          }
        )

      }


    </div>







    {/* DESKTOP */}

   <div className="
  hidden
  grid-cols-2
  gap-4
  md:grid
">


      {
        items.map(
          item => {


            const Icon =
              item.icon



            return (

              <Link

                key={
                  item.label
                }

                href={
                  item.href
                }

                className="
  flex
  min-h-[110px]
  flex-col
  justify-between
  rounded-xl
  border
  p-5
  transition
  hover:border-primary
  hover:shadow-sm
"

              >


                <Icon className="
                  h-5
                  w-5
                  text-muted-foreground
                "/>



                <p className="
                  mt-3
                  text-2xl
                  font-semibold
                ">

                  {item.value}

                </p>



                <p className="
                  text-sm
                  text-muted-foreground
                ">

                  {item.label}

                </p>


              </Link>

            )

          }
        )

      }


    </div>



  </DashboardCardContent>


</DashboardCard>

)

}