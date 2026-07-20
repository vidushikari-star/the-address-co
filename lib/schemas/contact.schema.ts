import { z } from "zod"

export const createContactSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name is required"),

  phone: z
    .string()
    .trim()
    .min(10, "Phone number is required"),

  email: z
    .string()
    .trim()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),

  city: z.string().optional(),

  country: z.string().optional(),

  whatsapp: z.string().optional(),

  preferredLanguage: z.string().optional(),

  leadSource: z.string().optional(),

  budgetMin: z.number().optional(),

  budgetMax: z.number().optional(),

  currency: z.string().optional(),

  purpose: z.string().optional(),

  timeline: z.string().optional(),

  financing: z.string().optional(),

  resident: z.string().optional(),

  propertyType: z.string().optional(),

  bedrooms: z.string().optional(),

  bathrooms: z.number().optional(),

  locations: z.array(z.string()).optional(),

  minArea: z.number().optional(),

  maxArea: z.number().optional(),

  plotSize: z.number().optional(),

  mustHave: z.array(z.string()).optional(),

  niceToHave: z.array(z.string()).optional(),

  spouseName: z.string().optional(),

  coBuyer: z.string().optional(),

  referralSource: z.string().optional(),

  notes: z.string().optional(),

  privateNotes: z.string().optional(),
})

export type CreateContactInput = z.infer<
  typeof createContactSchema
>