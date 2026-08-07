import type {
  Contact,
} from "@/types/contact"



export type LeadPriority =
  | "hot"
  | "warm"
  | "cold"



export function getLeadPriority(
  contact: Contact
): {
  priority: LeadPriority
  label: string
  emoji: string
} {


  let score = 0



  // Has intent: sale/rental/both
  if(
    contact.intent
  ){

    score += 2

  }



  // Has budget
  if(
    contact.budgetMin ||
    contact.budgetMax
  ){

    score += 2

  }



  // Has property preference
  if(
    contact.propertyType
  ){

    score += 1

  }



  // Has timeline
  if(
    contact.timeline
  ){

    score += 1

  }



  // Has preferred locations
  if(
    contact.locations &&
    contact.locations.length > 0
  ){

    score += 1

  }



  // Strong qualification
  if(
    contact.mustHave &&
    contact.mustHave.length > 0
  ){

    score += 1

  }



  /*
    Activity decay

    Prevent inactive buyers
    from staying Hot forever
  */


  if(
    contact.lastActivityAt
  ){

    const lastActivity =
      new Date(
        contact.lastActivityAt
      )


    const daysInactive =
      Math.floor(
        (
          Date.now() -
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



    // Active in last 7 days
    if(
      daysInactive <= 7
    ){

      score += 2

    }


    // No activity for more than 60 days
    if(
      daysInactive > 60
    ){

      score -= 3

    }


  }
  else {

    // No activity should never be hot

    score -= 2

  }





  if(score >= 6){

    return {

      priority:"hot",

      label:"Hot Lead",

      emoji:"🔥",

    }

  }





  if(score >= 3){

    return {

      priority:"warm",

      label:"Warm Lead",

      emoji:"🟠",

    }

  }





  return {

    priority:"cold",

    label:"Cold Lead",

    emoji:"⚪",

  }

}