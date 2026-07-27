export type PropertyDocumentCategory =
  | "legal"
  | "marketing"
  | "transaction"
  | "other"



export interface PropertyDocument {

  id:string

  propertyId:string

  name:string

  category:PropertyDocumentCategory

  fileUrl:string

  fileType?:string

  createdAt:string

}