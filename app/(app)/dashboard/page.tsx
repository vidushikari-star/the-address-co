import {
  BriefcaseBusiness,
  CircleDollarSign,
  Home,
  Users,
} from "lucide-react"

import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { AgendaCard } from "@/components/dashboard/agenda-card"
import { HotLeads } from "@/components/dashboard/hot-leads"
import { PipelineCard } from "@/components/dashboard/pipeline-card"
import { StatCard } from "@/components/dashboard/stat-card"

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1650px] flex-col gap-6 px-6 pb-6">
      {/* KPI Cards */}
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Active Clients"
          value="42"
          subtitle="+6 this month"
          trend="up"
          icon={Users}
        />

        <StatCard
          title="Open Deals"
          value="18"
          subtitle="₹52 Cr inventory"
          icon={BriefcaseBusiness}
        />

        <StatCard
          title="Portfolio Value"
          value="₹182 Cr"
          subtitle="Across 31 listings"
          icon={Home}
        />

        <StatCard
          title="Commission Pipeline"
          value="₹1.84 Cr"
          subtitle="+12% this month"
          trend="up"
          icon={CircleDollarSign}
        />
      </section>

      {/* Pipeline + Agenda */}
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <PipelineCard
            stages={[
              {
                title: "Lead",
                count: 14,
              },
              {
                title: "Qualified",
                count: 8,
              },
              {
                title: "Site Visit",
                count: 5,
              },
              {
                title: "Negotiation",
                count: 3,
              },
              {
                title: "Documentation",
                count: 2,
              },
              {
                title: "Closed",
                count: 7,
              },
            ]}
          />
        </div>

        <AgendaCard
          items={[
            {
              time: "10:00",
              title: "Client Meeting",
              description: "Villa Miramar",
              type: "meeting",
            },
            {
              time: "12:30",
              title: "Follow-up Call",
              description: "Mr. Shah",
              type: "call",
            },
            {
              time: "16:00",
              title: "Site Visit",
              description: "Dona Paula",
              type: "visit",
            },
            {
              time: "19:00",
              title: "Seller Review",
              description: "Casa Verde",
              type: "meeting",
            },
          ]}
        />
      </section>

      {/* Recent Activity + Hot Leads */}
      <section className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ActivityFeed
            activities={[
              {
                time: "10:15",
                title: "Rajiv Shah moved to Negotiation",
                description: "Casa Verde • ₹8.2 Cr",
                type: "property",
              },
              {
                time: "11:40",
                title: "Seller uploaded floor plans",
                description: "108 Horizon",
                type: "document",
              },
              {
                time: "14:20",
                title: "Commission received",
                description: "₹18,00,000",
                type: "commission",
              },
              {
                time: "16:45",
                title: "New buyer added",
                description: "Assagao Villa",
                type: "client",
              },
            ]}
          />
        </div>

        <HotLeads
          leads={[
            {
              name: "Rajiv Shah",
              budget: "₹12 Cr",
              location: "Assagao",
              stage: "Site Visit",
            },
            {
              name: "Ananya Mehta",
              budget: "₹8 Cr",
              location: "Dona Paula",
              stage: "Negotiation",
            },
            {
              name: "Karan Malhotra",
              budget: "₹15 Cr",
              location: "Parra",
              stage: "Qualified",
            },
          ]}
        />
      </section>
    </div>
  )
}