type PropertyMessageInput = {

  contactName?: string | null

  advisorName?: string | null

  property: {

    name: string

    location?: string | null

    publicLink?: string | null

  }

}





export function generatePropertyShareMessage({

  contactName,

  advisorName,

  property,

}: PropertyMessageInput) {


  const name =
    contactName?.trim()
      ? contactName
      : "there"


  const location =
    property.location?.trim()
      ? `\n${property.location.trim()}`
      : ""

  const listingLink =
    property.publicLink?.trim()
      ? `\n\nView the full listing, photos and pricing:\n${property.publicLink.trim()}`
      : ""

  const signOff =
    advisorName?.trim() || "The Address Co."

  return `Hi ${name},

I’m sharing a property that may be relevant:

${property.name}${location}${listingLink}

Please let me know if you’d like to discuss it or arrange a viewing.

Regards,
${signOff}`
}
