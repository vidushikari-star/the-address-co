export type WhatsAppQualification = {

  intent:
    | "BUY"
    | "SELL"
    | "RENT"
    | "LEASE"
    | "UNKNOWN"


  propertyType?: 
    | "apartment"
    | "villa"
    | "plot"
    | "penthouse"
    | "commercial"


  location?: string


  bedrooms?: number


  budget?: string


  timeline?: string

}





export function qualifyWhatsAppMessage(
  message: string
): WhatsAppQualification {


  const text =
    message.toLowerCase()



  let intent:
    WhatsAppQualification["intent"] =
      "UNKNOWN"



  if (
    text.includes("buy") ||
    text.includes("purchase") ||
    text.includes("looking for") ||
    text.includes("want")
  ) {

    intent = "BUY"

  }


  if (
    text.includes("sell") ||
    text.includes("selling") ||
    text.includes("list")
  ) {

    intent = "SELL"

  }


  if (
    text.includes("rent") ||
    text.includes("tenant")
  ) {

    intent = "RENT"

  }


  if (
    text.includes("lease")
  ) {

    intent = "LEASE"

  }





  let propertyType:
    WhatsAppQualification["propertyType"]



  if (
    text.includes("villa")
  ) {

    propertyType = "villa"

  }


  else if (
    text.includes("apartment") ||
    text.includes("flat")
  ) {

    propertyType = "apartment"

  }


  else if (
    text.includes("plot") ||
    text.includes("land")
  ) {

    propertyType = "plot"

  }


  else if (
    text.includes("penthouse")
  ) {

    propertyType = "penthouse"

  }


  else if (
    text.includes("commercial") ||
    text.includes("office") ||
    text.includes("shop")
  ) {

    propertyType = "commercial"

  }





  let bedrooms:number | undefined



  const bedroomMatch =
    text.match(
      /(\d+)\s*(bhk|bedroom)/
    )


  if(
    bedroomMatch
  ){

    bedrooms =
      Number(
        bedroomMatch[1]
      )

  }






  let location:string | undefined



  const goaLocations = [

    "assagao",
    "assagaon",
    "parra",
    "siolim",
    "morjim",
    "mandrem",
    "vagator",
    "anjuna",
    "candolim",
    "calangute",
    "baga",
    "sangolda",
    "saligao",
    "pilerne",
    "porvorim",
    "dona paula",
    "panjim",
    "miramar",
    "old goa",

  ]



  const foundLocation =
    goaLocations.find(
      (place) =>
        text.includes(place)
    )



  if(foundLocation){

    location =
      foundLocation

  }





  let budget:string | undefined



  const croreMatch =
    text.match(
      /(\d+(\.\d+)?)\s*(cr|crore|crores)/
    )



  if(croreMatch){

    budget =
      String(
        Number(croreMatch[1]) * 10000000
      )

  }



  const millionMatch =
    text.match(
      /(\d+(\.\d+)?)\s*(m|million)/
    )



  if(
    millionMatch
  ){

    budget =
      String(
        Number(millionMatch[1]) * 1000000
      )

  }





  let timeline:string | undefined



  if(
    text.includes("immediately") ||
    text.includes("urgent") ||
    text.includes("now")
  ){

    timeline="Immediate"

  }


  else if(
    text.includes("next year")
  ){

    timeline="Next Year"

  }


  else if(
    text.includes("few months")
  ){

    timeline="Few Months"

  }




  return {

    intent,

    propertyType,

    location,

    bedrooms,

    budget,

    timeline,

  }

}