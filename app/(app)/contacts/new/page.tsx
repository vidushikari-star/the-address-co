import { UserPlus } from "lucide-react"

import { BuyerForm } from "@/components/forms/buyer-form"

export default function NewBuyerPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-primary/10 p-4">
            <UserPlus className="h-7 w-7 text-primary" />
          </div>

          <div>
            <h1 className="text-3xl font-bold">
              New Buyer
            </h1>

            <p className="text-muted-foreground">
              Capture buyer requirements and preferences.
            </p>
          </div>
        </div>
      </div>

      <BuyerForm />
    </div>
  )
}