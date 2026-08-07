export function formatContactRole(
  role:string
){

  switch(role){

    case "owner":
      return "Owner"

    case "buyer":
      return "Buyer"

    case "tenant":
      return "Tenant"

    case "developer":
      return "Developer"

    case "broker":
      return "Broker"

    case "mou_holder":
      return "MOU Holder"

    default:
      return role

  }

}