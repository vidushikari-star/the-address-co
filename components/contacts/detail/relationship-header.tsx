import {
  ArrowLeft,
  Calendar,
  Mail,
  MoreHorizontal,
  Phone,
  Star,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DashboardCard,
  DashboardCardContent,
} from "@/components/ui/dashboard-card"

export function RelationshipHeader() {
  return (
    <DashboardCard>
      <DashboardCardContent className="space-y-8 p-8">
        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Relationships
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="outline">
              Edit
            </Button>

            <Button
              variant="ghost"
              size="icon"
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main */}
        <div className="flex items-start justify-between gap-8">
          <div className="space-y-5">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
                Buyer
              </p>

              <h1 className="mt-2 text-4xl font-semibold tracking-tight">
                Rajiv Shah
              </h1>

              <p className="mt-3 max-w-2xl text-muted-foreground">
                Looking for a luxury villa in Assagao, Parra or
                Siolim as a permanent family residence.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
                Negotiation
              </div>

              <div className="rounded-full border px-4 py-2 text-sm">
                ₹12–15 Cr Budget
              </div>

              <div className="rounded-full border px-4 py-2 text-sm">
                Priority A
              </div>
            </div>
        </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-3">
            <Button className="justify-start gap-2">
              <Phone className="h-4 w-4" />
              Call
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-2"
            >
              <Calendar className="h-4 w-4" />
              Schedule Meeting
            </Button>

            <Button
              variant="ghost"
              className="justify-start gap-2"
            >
              <Star className="h-4 w-4" />
              Add Follow-up
            </Button>
          </div>
        </div>
      </DashboardCardContent>
    </DashboardCard>
  )
}