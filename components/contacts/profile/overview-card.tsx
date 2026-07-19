import { ProfileCard } from "@/components/profile/profile-card"

export function OverviewCard() {
  return (
    <ProfileCard
      title="Overview"
      description="Client snapshot"
    >
      <div className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Budget
          </p>

          <p className="mt-1 text-lg font-semibold">
            ₹12–15 Cr
          </p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Preferred Locations
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {[
              "Assagao",
              "Parra",
              "Siolim",
            ].map((location) => (
              <span
                key={location}
                className="rounded-full bg-muted px-3 py-1 text-sm"
              >
                {location}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Property
            </p>

            <p className="mt-1 font-medium">
              Villa
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Bedrooms
            </p>

            <p className="mt-1 font-medium">
              4 BHK
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Timeline
            </p>

            <p className="mt-1 font-medium">
              Within 6 months
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Advisor
            </p>

            <p className="mt-1 font-medium">
              Vidushi Kari
            </p>
          </div>
        </div>
      </div>
    </ProfileCard>
  )
}