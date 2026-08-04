import type {
  Property,
} from "@/types/property"



type PropertyPriceRow = {
  asking?: number | string | null
  rent?: number | string | null
  securityDeposit?: number | string | null
  commission?: number | string | null
}



type PropertySpecificationsRow = {
  bedrooms?: number | null
  bathrooms?: number | null
  carpetArea?: number | null
  plotArea?: number | null
  builtUpArea?: number | null
}



type PropertyRow = {

  id:string

  name:string | null

  slug:string | null


  developer:string | null


  property_type:string | null

  listing_type:string | null

  transaction_type:string | null

  development_stage:string | null


  status:Property["status"] | null


  location:string | null

  locality:string | null


  google_map_link:string | null


  cover_image:string | null

  public_link:string | null

    housing_listing_id:string | null

  housing_sync_status:string | null

  housing_last_synced_at:string | null

  housing_sync_error:string | null



  price:
    number |
    PropertyPriceRow |
    null



  specifications:
    PropertySpecificationsRow |
    null



  description:string | null


  amenities:string[] | null


  furnishing:
    Property["furnishing"] |
    null


  tags:string[] | null


  advisor:string | null


  buyer_matches:number | null


  last_shared:string | null


  note:string | null

}







function toPropertyType(
  value:string | null | undefined
):Property["propertyType"] {

  switch(value){

    case "Apartment":
    case "Villa":
    case "Plot":
    case "Penthouse":
    case "Commercial":

      return value

    default:

      return "Villa"

  }

}








function toListingType(
  value:string | null | undefined
):Property["listingType"] {

  switch(value){

    case "Primary":
    case "Resale":

      return value

    default:

      return "Primary"

  }

}








function toTransactionType(
  value:string | null | undefined
):Property["transactionType"] {

  switch(value){

    case "Sale":
    case "Rental":

      return value

    default:

      return "Sale"

  }

}








function toDevelopmentStage(
  value:string | null | undefined
):Property["developmentStage"] {

  switch(value){

    case "under_construction":
    case "ready_to_move":
    case "resale":

      return value

    default:

      return "ready_to_move"

  }

}

function toHousingSyncStatus(
  value:string | null | undefined
):Property["housingSyncStatus"] {

  switch(value){

    case "synced":
    case "needs_update":
    case "failed":

      return value

    default:

      return undefined

  }

}







export function mapPropertyRow(
  row:PropertyRow
):Property {


  const price =
    row.price !== null &&
    typeof row.price === "object"
      ? row.price
      : {}





  return {


    id:
      row.id,



    name:
      row.name ?? "",



    slug:
      row.slug ?? "",





    developer:
      row.developer ?? "",





    listingType:
      toListingType(
        row.listing_type
      ),





    transactionType:
      toTransactionType(
        row.transaction_type
      ),





    developmentStage:
      toDevelopmentStage(
        row.development_stage
      ),





    propertyType:
      toPropertyType(
        row.property_type
      ),





    status:
      row.status ?? "available",





    location:
      row.location ?? "",



    locality:
      row.locality ?? "",





    googleMapLink:
      row.google_map_link ?? "",





    coverImage:
      row.cover_image ?? "",



    publicLink:
      row.public_link ?? "",

          housingListingId:
      row.housing_listing_id ?? undefined,


    housingSyncStatus:
  toHousingSyncStatus(
    row.housing_sync_status
  ),


    housingLastSyncedAt:
      row.housing_last_synced_at ?? undefined,


    housingSyncError:
      row.housing_sync_error ?? undefined,





    price: {


      asking:
        Number(
          price.asking ?? 0
        ),



      rent:
        Number(
          price.rent ?? 0
        ),



      securityDeposit:
        Number(
          price.securityDeposit ?? 0
        ),



      commission:
        Number(
          price.commission ?? 0
        ),


    },







    specifications: {


      bedrooms:
        row.specifications?.bedrooms ?? 0,



      bathrooms:
        row.specifications?.bathrooms ?? 0,



      carpetArea:
        row.specifications?.carpetArea ?? 0,



      plotArea:
        row.specifications?.plotArea ?? 0,



      builtUpArea:
        row.specifications?.builtUpArea ?? 0,


    },







    description:
      row.description ?? "",





    amenities:
      row.amenities ?? [],





    furnishing:
      row.furnishing ?? undefined,





    tags:
      row.tags ?? [],





    advisor:
      row.advisor ?? "",





    buyerMatches:
      row.buyer_matches ?? 0,





    lastShared:
      row.last_shared ?? "",





    note:
      row.note ?? "",


  }

}