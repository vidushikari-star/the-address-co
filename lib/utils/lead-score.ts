import type {
Contact,
} from "@/types/contact"



export type LeadPriority =
  | "hot"
  | "warm"
  | "cold"



function isBuyerContact(
contact: Contact
){

const roles =
contact.relationshipTypes
?.map(
  role =>
    role.toLowerCase()
)
?? []



return roles.some(
role =>
[
"buyer",
"investor",
"tenant",
].includes(role)
)

}



function isSellerContact(
contact: Contact
){

const roles =
contact.relationshipTypes
?.map(
  role =>
    role.toLowerCase()
)
?? []



return roles.some(
role =>
[
"owner",
"developer",
"mou holder",
"broker",
].includes(role)
)

}



export function getLeadPriority(
contact: Contact
): {
priority: LeadPriority
label: string
emoji: string
} {



/*
SELLER SIDE CONTACTS

Owner
Developer
MOU Holder
Broker

Do not use buyer qualification scoring.
*/

if(
isSellerContact(contact)
){

let score = 0



// Has activity
if(
contact.lastActivityAt
){

const lastActivity =
new Date(
contact.lastActivityAt
)


const daysInactive =
Math.floor(
(
Date.now()
-
lastActivity.getTime()
)
/
(
1000 *
60 *
60 *
24
)
)



if(
daysInactive <= 14
){

score += 2

}



if(
daysInactive > 90
){

score -= 2

}

}
else {

score -= 1

}



// Has notes / engagement
if(
contact.notes
){

score += 1

}



// Has follow up scheduled
if(
contact.nextFollowUpAt
){

score += 1

}



if(score >= 3){

return {

priority:"hot",

label:"Active Relationship",

emoji:"🏡",

}

}



if(score >= 1){

return {

priority:"warm",

label:"Engaged Relationship",

emoji:"🟠",

}

}



return {

priority:"cold",

label:"Dormant Relationship",

emoji:"⚪",

}

}



/*
BUYER SIDE CONTACTS

Buyer
Investor
Tenant

Use qualification scoring.
*/


let score = 0



// Has intent
if(
contact.intent
){

score += 2

}



// Has budget
if(
contact.budgetMin ||
contact.budgetMax
){

score += 2

}



// Has property preference
if(
contact.propertyType
){

score += 1

}



// Has timeline
if(
contact.timeline
){

score += 1

}



// Has preferred locations
if(
contact.locations &&
contact.locations.length > 0
){

score += 1

}



// Strong qualification
if(
contact.mustHave &&
contact.mustHave.length > 0
){

score += 1

}



/*
Activity decay
*/

if(
contact.lastActivityAt
){

const lastActivity =
new Date(
contact.lastActivityAt
)



const daysInactive =
Math.floor(
(
Date.now()
-
lastActivity.getTime()
)
/
(
1000 *
60 *
60 *
24
)
)



if(
daysInactive <= 7
){

score += 2

}



if(
daysInactive > 60
){

score -= 3

}

}
else {

score -= 2

}



if(score >= 6){

return {

priority:"hot",

label:"Hot Lead",

emoji:"🔥",

}

}



if(score >= 3){

return {

priority:"warm",

label:"Warm Lead",

emoji:"🟠",

}

}



return {

priority:"cold",

label:"Cold Lead",

emoji:"⚪",

}

}