import type {
  ReportRange,
} from "@/lib/reports/report-date-utils"

import {
  getDateRange,
} from "@/lib/reports/report-date-utils"





export function filterByDate<T extends {
  createdAt?:string
  receivedDate?:string
  date?:string
}>(
  items:T[],
  range:ReportRange
){


  const {
    start,
    end,
  } =
  getDateRange(
    range
  )



  if(
    !start ||
    !end
  ){

    return items

  }





  return items.filter(
    item => {


      const itemDate =
        new Date(
          item.receivedDate ??
          item.createdAt ??
          item.date ??
          ""
        )



      return (

        itemDate >= start &&
        itemDate <= end

      )

    }
  )

}