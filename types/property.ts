export type PropertyStatus =
  | "available"
  | "viewed"
  | "shortlisted"
  | "rejected"
  | "offer"
  | "purchased"


export type ListingType =
  | "Primary"
  | "Resale"
  | "Rental"


export type PropertyType =
  | "Apartment"
  | "Villa"
  | "Plot"
  | "Penthouse"
  | "Commercial"


export type DevelopmentStage =
  | "under_construction"
  | "ready_to_move"
  | "resale"



export type FurnishingType =
  | "furnished"
  | "semi_furnished"
  | "unfurnished"



export interface PropertyPrice {

  asking:number

  commission?:number

}





export interface PropertySpecifications {

  bedrooms:number

  bathrooms:number

  carpetArea:number

  plotArea?:number

  builtUpArea?:number

}





export interface Property {


  id:string


  // Identity

  name:string

  slug:string



  // Project / Developer

  developer:string



  listingType:ListingType

  developmentStage:DevelopmentStage



  propertyType:PropertyType



  // CRM Status

  status:PropertyStatus



  // Location

  locality?:string

  location:string



  googleMapLink?:string



  // Media

  coverImage?:string



  publicLink?:string



  // Pricing

  price:PropertyPrice



  // Specifications

  specifications:PropertySpecifications



  // Marketing

  description?:string


  amenities?:string[]


  furnishing?:FurnishingType



  // Features

  tags?:string[]



  // CRM

  advisor:string


  buyerMatches:number


  lastShared:string



  note?:string

}