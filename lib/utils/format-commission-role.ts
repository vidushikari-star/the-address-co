export function formatCommissionRole(
  role?: string
){

  switch(role){

    case "buyer":
      return "Buyer Commission"

    case "tenant":
      return "Tenant Commission"

    case "owner":
      return "Owner Commission"

    case "developer":
      return "Developer Commission"

    case "broker":
      return "Broker Commission"

    case "mou_holder":
      return "MOU Holder Commission"

    default:
      return "Commission"

  }

}