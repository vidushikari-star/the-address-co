import {
getServerUserProfile,
} from "@/lib/auth/server-user-profile"

import {
  BriefcaseBusiness,
  CircleDollarSign,
  Home,
  Users,
} from "lucide-react"


import {
  getDashboardStats,
  getDealHealthSummary,
  getRecentActivities,
  getUpcomingTasks,
  getHotLeads,
  getMyWork,
  getFollowUpContacts,
} from "@/lib/services/dashboard-service"


import {
  getCommissionStats,
} from "@/lib/services/commission-service"



import { AgendaCard } from "@/components/dashboard/agenda-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { DealHealthCard } from "@/components/dashboard/deal-health-card"
import { HotLeads } from "@/components/dashboard/hot-leads"
import { MyWork } from "@/components/dashboard/my-work"
import { DealsAtRisk } from "@/components/dashboard/deals-at-risk"
import { PipelineCard } from "@/components/dashboard/pipeline-card"
import { StatCard } from "@/components/dashboard/stat-card"
import { UpcomingCommissions } from "@/components/dashboard/upcoming-commissions"
import { FollowUpQueue } from "@/components/dashboard/follow-up-queue"



import {
  formatCurrency,
} from "@/lib/utils/format-currency"



export const dynamic = "force-dynamic"







export default async function DashboardPage(){

const user =
await getServerUserProfile()


const [
stats,
recentActivities,
upcomingTasks,
hotLeads,
commissionStats,
myWork,
dealHealth,
followUpQueue,
] = await Promise.all([

getDashboardStats(),

getRecentActivities(),

getUpcomingTasks(),

getHotLeads(),

getCommissionStats(),

getMyWork(
  user?.id
),

getDealHealthSummary(),

getFollowUpContacts(),

])






  const pipelineStages = [


    {
      title:"Lead",
      count:
        stats.deals.filter(
          deal =>
            deal.stage === "lead"
        ).length,
    },


    {
      title:"Qualified",
      count:
        stats.deals.filter(
          deal =>
            deal.stage === "qualification"
        ).length,
    },


    {
      title:"Property Shared",
      count:
        stats.deals.filter(
          deal =>
            deal.stage === "property_shared"
        ).length,
    },


    {
      title:"Site Visit",
      count:
        stats.deals.filter(
          deal =>
            deal.stage === "site_visit"
        ).length,
    },


    {
      title:"Negotiation",
      count:
        stats.deals.filter(
          deal =>
            deal.stage === "negotiation"
        ).length,
    },


    {
      title:"Documentation",
      count:
        stats.deals.filter(
          deal =>
            deal.stage === "documentation"
        ).length,
    },


  ]








  return (

    <main

      className="
        mx-auto
        w-full
        max-w-[1650px]
        space-y-8
        bg-muted/10
        px-4
        pb-10
        pt-6
        sm:px-6
        lg:px-8
      "

    >





      {/* EXECUTIVE SUMMARY */}


      <section

        className="
          grid
          grid-cols-1
          gap-4
          sm:grid-cols-2
          xl:grid-cols-4
        "

      >


        <StatCard

          title="Active Relationships"

          value={
            String(
              stats.activeContactsCount
            )
          }

          subtitle={
            `${stats.contactsCount} total contacts`
          }

          trend="up"

          icon={Users}

        />




        <StatCard

          title="Open Deals"

          value={
            String(
              stats.openDealsCount
            )
          }

          subtitle={
            `${formatCurrency(
              stats.pipelineValue
            )} pipeline`
          }

          icon={BriefcaseBusiness}

        />




        <StatCard

          title="Live Portfolio"

          value={
            formatCurrency(
              stats.portfolioValue
            )
          }

          subtitle={
            `${stats.propertiesCount} listings`
          }

          icon={Home}

        />




        <StatCard

          title="Commission Pipeline"

          value={
            formatCurrency(
              commissionStats.pending
            )
          }

          subtitle={
            `${formatCurrency(
              commissionStats.received
            )} received`
          }

          trend="up"

          icon={CircleDollarSign}

        />


      </section>









      {/* TODAY'S COMMAND CENTRE */}


      <section

        className="
          grid
          gap-6
          xl:grid-cols-3
        "

      >


        <div

          className="
            xl:col-span-2
          "

        >

          <FollowUpQueue

            queue={
              followUpQueue
            }

          />


        </div>



        <AgendaCard

          items={
            upcomingTasks
          }

        />


      </section>









      {/* OPPORTUNITIES */}

<section
  className="
    grid
    gap-6
    xl:grid-cols-2
  "
>


  <MyWork
    data={myWork}
  />



  <HotLeads
    leads={hotLeads}
  />


</section>









      {/* SALES PIPELINE */}


      <section>


        <PipelineCard


          summary={{

            activeClients:
              stats.contactsCount,


            inventoryValue:
              stats.portfolioValue,


            inventoryCount:
              stats.propertiesCount,


            commissionPotential:
              stats.commissionPipeline,


          }}


          stages={
            pipelineStages
          }


        />


      </section>









      {/* DEAL HEALTH */}


      <section

        className="
          grid
          gap-6
          xl:grid-cols-2
        "

      >


        <DealsAtRisk

          deals={
            dealHealth.concerns ?? []
          }

        />



        <DealHealthCard

          data={
            dealHealth
          }

        />


      </section>









      {/* ACTIVITY + FINANCE */}


      <section

        className="
          grid
          gap-6
          xl:grid-cols-2
        "

      >


        <ActivityFeed

          activities={
            recentActivities
          }

        />




        <UpcomingCommissions

          commissions={
            commissionStats.upcoming
          }

        />


      </section>




    </main>


  )

}