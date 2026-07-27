import type { Deal } from "@/types/deal"



export type DealHealthStatus =
  | "healthy"
  | "attention"
  | "risk"



export type DealHealth = {

  score:number

  status:DealHealthStatus

  reasons:string[]

}





export function calculateDealHealth(
  deal:Deal
):DealHealth {


  let score = 50


  const reasons:string[] = []




  const lastActivity =
    new Date(
      deal.lastActivity
    )



  const daysSinceActivity =
    Math.floor(
      (
        Date.now()
        -
        lastActivity.getTime()
      )
      /
      (
        1000 *
        60 *
        60 *
        24
      )
    )





  // Activity

  if(daysSinceActivity <= 7){

    score += 20

    reasons.push(
      "Recent activity recorded"
    )

  }


  else if(daysSinceActivity <= 14){

    score -= 15

    reasons.push(
      `No activity for ${daysSinceActivity} days`
    )

  }


  else {

    score -= 30

    reasons.push(
      `No activity for ${daysSinceActivity} days`
    )

  }





  // Priority

  if(
    deal.priority === "high"
  ){

    score += 10

    reasons.push(
      "High priority deal"
    )

  }





  // Deal stage

  if(
    [
      "site_visit",
      "negotiation",
      "documentation",
    ].includes(
      deal.stage
    )
  ){

    score += 15

    reasons.push(
      "Advanced deal stage"
    )

  }





  // Tasks

  if(
    deal.tasks?.length
  ){

    score += 5

    reasons.push(
      "Active follow-up tasks"
    )

  }

  else {

    score -= 10

    reasons.push(
      "No pending tasks"
    )

  }







  score =
    Math.max(
      0,
      Math.min(
        100,
        score
      )
    )





  let status:DealHealthStatus



  if(score >= 70){

    status = "healthy"

  }

  else if(score >= 40){

    status = "attention"

  }

  else {

    status = "risk"

  }





  return {

    score,

    status,

    reasons,

  }


}