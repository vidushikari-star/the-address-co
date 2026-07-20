import { Building2 } from "lucide-react"

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Building2 className="h-6 w-6 text-primary" />
        </div>

        <div>
          <h1 className="text-3xl font-bold">
            New Property
          </h1>

          <p className="text-muted-foreground">
            Add a property to your inventory.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-8">
        Property form coming next...
      </div>
    </div>
  )
}