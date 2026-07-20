import { Handshake } from "lucide-react"

export default function NewDealPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-3">
          <Handshake className="h-6 w-6 text-primary" />
        </div>

        <div>
          <h1 className="text-3xl font-bold">
            New Deal
          </h1>

          <p className="text-muted-foreground">
            Create a new transaction.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-8">
        Deal form coming next...
      </div>
    </div>
  )
}