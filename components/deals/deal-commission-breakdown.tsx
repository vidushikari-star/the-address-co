import type {
  PropertySource,
} from "@/lib/repositories/property-contact-repository"

import type {
  Deal,
} from "@/types/deal"



type DealCommissionBreakdownProps = {

  deal: Deal

  propertySources: PropertySource[]

  showPropertyValue?: boolean

}



function sourceLabel(
  relationshipType: PropertySource["relationshipType"]
){


  switch(relationshipType){

    case "owner":
      return "Owner"

    case "developer":
      return "Developer"

    case "mou_holder":
      return "MOU Holder"

    case "broker":
      return "Broker"

  }

}



export function DealCommissionBreakdown({
  deal,
  propertySources,
  showPropertyValue = false,
}: DealCommissionBreakdownProps) {


  const buyerLabel =
    deal.value.commissionType === "rental"
      ? "Tenant"
      : "Buyer"



  const buyerPercentage =
    deal.value.commissionPercentage



  const sellerCommissions =
    propertySources.flatMap(
      source => {


        const percentage =
          source.commission?.percentage



        if(percentage === undefined){

          return []

        }



        return [{

          id: source.id,

          label:
            `${sourceLabel(source.relationshipType)} · ${source.contact.name}`,

          percentage,

          amount:
            deal.value.propertyPrice * percentage / 100,

        }]


      }
    )



  return (

    <div className="space-y-3">

      {
        showPropertyValue && (

          <div className="flex items-start justify-between gap-4 text-sm">

            <p className="font-medium">
              Property value
            </p>

            <p className="shrink-0 font-semibold">
              ₹{deal.value.propertyPrice.toLocaleString("en-IN")}
            </p>

          </div>

        )
      }

      <CommissionRow
        label={`${buyerLabel} commission`}
        percentage={buyerPercentage}
        amount={deal.value.commissionAmount}
      />



      {
        sellerCommissions.map(
          commission => (

            <CommissionRow
              key={commission.id}
              label={commission.label}
              percentage={commission.percentage}
              amount={commission.amount}
            />

          )
        )
      }



      {
        sellerCommissions.length === 0 && (

          <p className="text-sm text-muted-foreground">
            No seller commission agreement is linked to this property.
          </p>

        )
      }

    </div>

  )

}



function CommissionRow({
  label,
  percentage,
  amount,
}: {
  label: string
  percentage?: number
  amount: number
}) {


  return (

    <div className="flex items-start justify-between gap-4 text-sm">

      <div>

        <p className="font-medium">
          {label}
        </p>

        <p className="text-muted-foreground">
          {
            percentage !== undefined
              ? `${percentage}% of property value`
              : "Fixed commission"
          }
        </p>

      </div>

      <p className="shrink-0 font-semibold text-primary">
        ₹{amount.toLocaleString("en-IN")}
      </p>

    </div>

  )

}
