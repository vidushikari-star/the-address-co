export type ReportRange =
  | "all"
  | "month"
  | "last_month"
  | "quarter"
  | "year"





export function getDateRange(
  range:ReportRange
){

  const now =
    new Date()


  const start =
    new Date()


  const end =
    new Date()





  if(range === "all"){

    return {
      start:null,
      end:null,
    }

  }





  if(range === "month"){

    start.setDate(1)

  }





  if(range === "last_month"){

    start.setMonth(
      now.getMonth() - 1
    )

    start.setDate(1)


    end.setDate(0)

  }





  if(range === "quarter"){

    const quarter =
      Math.floor(
        now.getMonth() / 3
      )


    start.setMonth(
      quarter * 3
    )

    start.setDate(1)

  }





  if(range === "year"){

    start.setMonth(0)

    start.setDate(1)

  }





  return {

    start,

    end:
      range === "last_month"
        ? end
        : now,

  }

}