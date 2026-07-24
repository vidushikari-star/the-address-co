export type WhatsAppTemplateKey =
  | "new_lead"
  | "property_shared"
  | "site_visit_reminder"
  | "post_site_visit"
  | "negotiation"
  | "general_follow_up"




export const WHATSAPP_TEMPLATES = {


  new_lead: {

    label:
      "New Lead Follow Up",


    message: (
      name:string
    ) =>

`Hi ${name},

This is Vidushi from The Address Co.

Thank you for your interest in Goa real estate.

I would love to understand your requirements better and share suitable options.

Regards,
Vidushi`

  },





  property_shared: {

    label:
      "Property Shared",


    message: (
      name:string,
      property?:string
    ) =>

`Hi ${name},

Sharing the details of the property we discussed.

${property ?? "Property details"}

Please let me know your thoughts.

Happy to arrange a viewing.

Regards,
Vidushi`

  },





  site_visit_reminder: {

    label:
      "Site Visit Reminder",


    message: (
      name:string,
      date?:string,
      time?:string
    ) =>

`Hi ${name},

Just confirming your site visit scheduled ${date ?? "today"} at ${time ?? ""}.

Looking forward to showing you the property.

Regards,
Vidushi`

  },





  post_site_visit: {

    label:
      "Post Site Visit",


    message: (
      name:string
    ) =>

`Hi ${name},

Hope you enjoyed the site visit.

Would love to hear your feedback and discuss the next steps.

Regards,
Vidushi`

  },





  negotiation: {

    label:
      "Negotiation Follow Up",


    message: (
      name:string
    ) =>

`Hi ${name},

Following up regarding the property discussion.

Let me know if you would like to proceed further or discuss any points.

Regards,
Vidushi`

  },





  general_follow_up: {

    label:
      "General Follow Up",


    message: (
      name:string
    ) =>

`Hi ${name},

Following up regarding your Goa property requirement.

Please let me know how I can assist you.

Regards,
Vidushi`

  },


}