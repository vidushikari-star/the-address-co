import type { Contact } from "@/types"

type Advisor = {
  full_name: string
}

type Property = {
  name?: string | null
  location?: string | null
  price?: string | number | null
}

type RenderTemplateOptions = {
  contact: Contact
  advisor?: Advisor | null
  property?: Property | null
}

export function renderTemplate(
  template: string,
  {
    contact,
    advisor,
    property,
  }: RenderTemplateOptions
) {
  const variables: Record<string, string> = {
    buyer_name: contact.name ?? "",
    seller_name: contact.name ?? "",
    broker_name: contact.name ?? "",
    developer_name: contact.name ?? "",
    contact_name: contact.name ?? "",

    phone: contact.phone ?? "",
    whatsapp: contact.whatsapp ?? "",
    email: contact.email ?? "",

    agent_name: advisor?.full_name ?? "",

    property_name: property?.name ?? "",
    location: property?.location ?? "",
    price:
      property?.price != null
        ? String(property.price)
        : "",

    date: "",
    time: "",
    feedback: "",
    enquiries: "",
    viewings: "",
    offers: "",
    documents: "",
  }

  return template.replace(
    /\{\{(.*?)\}\}/g,
    (_, key: string) => variables[key.trim()] ?? ""
  )
}