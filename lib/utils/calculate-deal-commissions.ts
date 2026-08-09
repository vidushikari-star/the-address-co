import type {
  PropertySource,
} from "@/lib/repositories/property-contact-repository"

import type {
  Deal,
} from "@/types/deal"

import type {
  CommissionType,
} from "@/types/commission"




type Input = {

  deal: Deal

  propertySources: PropertySource[]

  closingPrice:number

}

type CalculatedDealCommission = {
  dealId: string
  contactId: string
  propertyId: string
  advisorId?: string
  type: CommissionType
  commissionRole:
    | "buyer"
    | "tenant"
    | "owner"
    | "developer"
    | "broker"
    | "mou_holder"
  commissionBasis: "percentage" | "fixed"
  commissionPercentage: number
  amount: number
  notes: string
}





export function calculateDealCommissions({

  deal,

  propertySources,

  closingPrice,

}:Input){



  const commissions:CalculatedDealCommission[] = []





  /*
    BUYER / TENANT COMMISSION
  */



  const clientPercentage =
    deal.value.commissionPercentage
    ??
    0




  const clientAmount =

    clientPercentage > 0

      ?

      (
        closingPrice *
        clientPercentage /
        100
      )

      :

      (
        deal.value.commissionAmount
        ??
        0
      )






  if(
    clientAmount > 0 &&
    deal.contactId
  ){


    commissions.push({

      dealId:
        deal.id,


      contactId:
        deal.contactId,


      propertyId:
        deal.propertyId,


      advisorId:
        deal.advisorId,



      type:
        deal.value.commissionType as CommissionType,



      commissionRole:
        deal.value.commissionType === "rental"
          ? "tenant"
          : "buyer",



      commissionBasis:
        deal.value.commissionBasis,


      commissionPercentage:
        clientPercentage,


      amount:
        clientAmount,


      notes:
        deal.value.commissionType === "rental"
          ? "tenant commission"
          : "buyer commission",

    })


  }








  /*
    PROPERTY SOURCE COMMISSIONS
  */



  propertySources.forEach(

    source => {


      const percentage =
        source.commission?.percentage




      if(
        !percentage ||
        !source.contact.id
      ){

        return

      }





      const amount =

        closingPrice *
        percentage /
        100






      commissions.push({


        dealId:
          deal.id,



        contactId:
          source.contact.id,



        propertyId:
          deal.propertyId,



        advisorId:
          deal.advisorId,



        type:
          deal.value.commissionType as CommissionType,



        commissionRole:
          source.relationshipType,



        commissionBasis:
          "percentage",



        commissionPercentage:
          percentage,



        amount,



        notes:
          `${source.relationshipType} commission`


      })



    }

  )







  return commissions

}
