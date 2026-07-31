export function formatCurrency(
  value?: number | null
){

  if(
    value === null ||
    value === undefined ||
    isNaN(value)
  ){

    return "₹0"

  }



  if(value >= 10000000){

    return `₹${(
      value / 10000000
    ).toFixed(1)} Cr`

  }



  if(value >= 100000){

    return `₹${(
      value / 100000
    ).toFixed(1)} L`

  }



  if(value >= 1000){

    return `₹${(
      value / 1000
    ).toFixed(0)}K`

  }



  return `₹${value}`

}







export function formatPropertyPrice(
  value?: number | null,
  transactionType?: string
){

  const isRental =
    transactionType?.toLowerCase() === "rental"



  if(isRental){

    return `${formatCurrency(
      value
    )}/month`

  }



  return formatCurrency(
    value
  )

}