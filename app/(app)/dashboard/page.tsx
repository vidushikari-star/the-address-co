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
  getNewLeads,
  getMyWork,
  getDealsToFollowUp,
} from "@/lib/services/dashboard-service"


import {
  getCommissionStats,
} from "@/lib/services/commission-service"


import { AgendaCard } from "@/components/dashboard/agenda-card"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { DealHealthCard } from "@/components/dashboard/deal-health-card"
import { HotLeads } from "@/components/dashboard/hot-leads"
import { MyWork } from "@/components/dashboard/my-work"
import { NewLeads } from "@/components/dashboard/new-leads"
import { NeedsAttention } from "@/components/dashboard/needs-attention"
import { PipelineCard } from "@/components/dashboard/pipeline-card"
import { StatCard } from "@/components/dashboard/stat-card"
import { UpcomingCommissions } from "@/components/dashboard/upcoming-commissions"


export const dynamic = "force-dynamic"



export default async function DashboardPage() {


  const [
    stats,
    recentActivities,
    upcomingTasks,
    hotLeads,
    newLeads,
    commissionStats,
    myWork,
    dealsToFollowUp,
    dealHealth,
  ] =
    await Promise.all([

      getDashboardStats(),

      getRecentActivities(),

      getUpcomingTasks(),

      getHotLeads(),

      getNewLeads(),

      getCommissionStats(),

      getMyWork(),

      getDealsToFollowUp(),

      getDealHealthSummary(),

    ])





    return (

    <div className="mx-auto flex w-full max-w-[1650px] flex-col gap-6 px-6 pb-6 pt-6">


      {/* TOP STATS */}

      <section className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">


        <StatCard
          title="Active Clients"
          value={String(stats.contactsCount)}
          subtitle="Total contacts"
          trend="up"
          icon={Users}
        />


        <StatCard
          title="Open Deals"
          value={String(stats.openDealsCount)}
          subtitle={`₹${(
            stats.pipelineValue / 10000000
          ).toFixed(1)} Cr pipeline`}
          icon={BriefcaseBusiness}
        />


        <StatCard
          title="Portfolio Value"
          value={`₹${(
            stats.portfolioValue / 10000000
          ).toFixed(1)} Cr`}
          subtitle={`${stats.propertiesCount} listings`}
          icon={Home}
        />


        <StatCard
          title="Commission Pipeline"
          value={`₹${(
            commissionStats.pending / 10000000
          ).toFixed(2)} Cr`}
          subtitle={`₹${(
            commissionStats.received / 10000000
          ).toFixed(2)} Cr received`}
          trend="up"
          icon={CircleDollarSign}
        />


      </section>







      {/* DAILY WORK */}


      <section className="grid gap-6 xl:grid-cols-3">


        <div className="xl:col-span-2">


          <MyWork
            data={myWork}
          />


        </div>



        <AgendaCard
          items={upcomingTasks}
        />


      </section>








      {/* SALES PRIORITY */}


      <section className="grid gap-6 xl:grid-cols-3">


        <div className="xl:col-span-2">


          <HotLeads
            leads={hotLeads}
          />


        </div>



        <NeedsAttention
          deals={dealsToFollowUp}
        />


      </section>








      {/* PIPELINE HEALTH */}


      <section className="grid gap-6 xl:grid-cols-3">


        <div className="xl:col-span-2">


          <PipelineCard

  summary={{
    activeClients: stats.contactsCount,
    inventoryValue: stats.portfolioValue,
    inventoryCount: stats.propertiesCount,
    commissionPotential: commissionStats.pending,
  }}

  stages={[

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


              {
                title:"Closed",
                count:
                  stats.deals.filter(
                    deal =>
                      deal.stage === "closed_won"
                  ).length,
              },

            ]}

          />


        </div>





        <DealHealthCard

          data={dealHealth}

        />


      </section>









      {/* ACTIVITY */}


      <section className="grid gap-6">


        <ActivityFeed

          activities={
            recentActivities
          }

        />


      </section>








      {/* NEW BUSINESS */}


      <section className="grid gap-6">


        <NewLeads

          leads={newLeads}

        />


      </section>








      {/* COMMISSIONS */}


      <section className="grid gap-6">


        <UpcomingCommissions

          commissions={
            commissionStats.upcoming
          }

        />


      </section>



    </div>

  )

}

