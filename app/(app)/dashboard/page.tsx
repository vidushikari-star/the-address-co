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

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">


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







      {/* MAIN DASHBOARD AREA */}


      <section className="grid gap-6 xl:grid-cols-3">



        {/* LEFT COLUMN */}


        <div className="space-y-6 xl:col-span-2">


          <MyWork
            data={myWork}
          />



          <div className="grid gap-6 xl:grid-cols-3">


            <div className="xl:col-span-2">


              <PipelineCard

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



            <AgendaCard

              items={
                upcomingTasks
              }

            />


          </div>


        </div>







        {/* RIGHT COLUMN */}


        <div className="space-y-6">


          <DealHealthCard

            data={
              dealHealth
            }

          />



          <HotLeads

            leads={
              hotLeads
            }

          />



          <ActivityFeed

            activities={
              recentActivities
            }

          />


        </div>



      </section>







      {/* LOWER SECTIONS */}



      <section className="grid gap-6">

        <NewLeads
          leads={newLeads}
        />

      </section>





      <section className="grid gap-6">


        <UpcomingCommissions

          commissions={
            commissionStats.upcoming
          }

        />


      </section>






      <section className="grid gap-6">


        <NeedsAttention

          deals={
            dealsToFollowUp
          }

        />


      </section>




    </div>

  )

}