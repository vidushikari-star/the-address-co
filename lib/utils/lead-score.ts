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