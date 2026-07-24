import {
  Users,
  PhoneCall,
  BriefcaseBusiness,
  MapPin,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"

import Link from "next/link"

type MyWorkProps = {
  data: {
    newLeads: number
    followUps: number
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
    label: "Follow Ups Due",
    value: data.followUps,
    icon: PhoneCall,
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

          <p className="text-sm text-muted-foreground">
            My Work
          </p>

          <h3 className="mt-2 text-2xl font-semibold">
            Today&apos;s Priorities
          </h3>

        </div>


      </DashboardCardHeader>



      <DashboardCardContent>


        <div className="grid grid-cols-2 gap-4">


          {
            items.map(
              item => {

                const Icon =
                  item.icon


                return (

                  <Link
  key={item.label}
  href={item.href}
  className="rounded-xl border p-4 transition hover:border-primary hover:shadow-sm"
>

                    <Icon
                      className="h-5 w-5 text-muted-foreground"
                    />


                    <p className="mt-3 text-2xl font-semibold">
                      {item.value}
                    </p>


                    <p className="text-sm text-muted-foreground">
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