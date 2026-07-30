type PropertyMessageInput = {

  contactName?: string | null

  property: {

    name: string

    location?: string | null

    property_type?: string | null

    bedrooms?: number | null

    public_link?: string | null

  }

}





export function generatePropertyShareMessage({

  contactName,

  property,

}: PropertyMessageInput) {


  const name =
    contactName?.trim()
      ? contactName
      : "there"



  const propertyType =
    property.property_type
      ? property.property_type
      : "property"




  const bedroomText =
    property.bedrooms
      ? `${property.bedrooms} Bedroom`
      : ""





  return `Hi ${name},

Based on your requirement, I thought you may like this property:

${property.name}

${bedroomText} ${propertyType}
${property.location ?? ""}

${
  property.public_link
    ? `View details:
${property.public_link}`
    : ""
}

Please let me know if you would like more details or would like to schedule a viewing.

Regards,
Vidushi`
}