export type PropertyDocumentCategory =
  | "brochure"
  | "floor_plan"
  | "price_sheet"
  | "payment_plan"
  | "approvals"
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

  /** Explicit CRM-admin allowlist for the server-side public share projection. */
  publicShareAllowed?: boolean

}
