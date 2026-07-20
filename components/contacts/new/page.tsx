import { UserPlus } from "lucide-react"

export default function NewBuyerPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <UserPlus className="h-6 w-6 text-primary" />
        </div>

        <div>
          <h1 className="text-3xl font-bold">
            New Buyer
          </h1>

          <p className="text-muted-foreground">
            Add a new buyer to your CRM.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-8">
        Buyer form coming next...
      </div>
    </div>
  )
}