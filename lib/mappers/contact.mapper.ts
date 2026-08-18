import type { Contact } from "@/types/contact"
import type { ContactRow } from "@/types/contact-row"


export function mapContactRow(
  row: ContactRow
): Contact {

  return {

    id: row.id,


    name:
      row.full_name,


    firstName:
      row.first_name,


    lastName:
      row.last_name ?? undefined,


    phone:
      row.phone,


    email:
      row.email ?? undefined,


    whatsapp:
      row.whatsapp ?? undefined,


    city:
      row.city ?? undefined,


    country:
      row.country ?? undefined,


    preferredLanguage:
      row.preferred_language ?? undefined,


    stage:
      row.lead_stage as Contact["stage"],


    leadSource:
      row.lead_source as Contact["leadSource"],

      intent:
  row.intent as Contact["intent"],

      nextFollowUpAt:
  row.next_follow_up_at ?? undefined,

      housingLeadId:
  row.housing_lead_id ?? undefined,

      relationshipTypes:
  row.relationship_types ?? [],


    assignedAdvisor:
  row.advisor?.full_name ??
  undefined,

  advisor:
  row.advisor?.id ?? undefined,


    budgetMin:
      row.budget_min ?? undefined,


    budgetMax:
      row.budget_max ?? undefined,

      lastActivityAt:
  row.last_activity_at ?? undefined,
      
createdAt:
  row.created_at ?? undefined,

    currency:
      row.currency ?? undefined,


    purpose:
      row.purpose as Contact["purpose"],


    timeline:
      row.timeline ?? undefined,


    financing:
      row.financing as Contact["financing"],


    resident:
      row.resident ?? undefined,


    propertyType:
      row.property_type ?? undefined,

      


    bedrooms:
      row.bedrooms != null
        ? Number(row.bedrooms)
        : undefined,


    bathrooms:
      row.bathrooms ?? undefined,


    locations:
      row.locations ?? [],


    minArea:
      row.min_area ?? undefined,


    maxArea:
      row.max_area ?? undefined,


    plotSize:
      row.plot_size ?? undefined,


    mustHave:
      row.must_have ?? [],


    niceToHave:
      row.nice_to_have ?? [],


    spouseName:
      row.spouse_name ?? undefined,


    coBuyer:
      row.co_buyer ?? undefined,


    referralSource:
      row.referral_source ?? undefined,


    notes:
      row.notes
        ? [
            {
              id: `${row.id}-note`,
              content: row.notes,
              createdAt: row.created_at,
            },
          ]
        : [],

    notesText:
      row.notes ?? undefined,


    privateNotes:
      row.private_notes ?? undefined,


    propertyIds:
      [],


    activities:
      [],


    tasks:
      [],


    deals:
      [],

  }

}
