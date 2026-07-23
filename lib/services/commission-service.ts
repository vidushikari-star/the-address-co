import {
  getCommissions,
} from "@/lib/repositories/commission-repository"



export async function getCommissionStats() {


  const commissions =
    await getCommissions()



  const pendingCommissions =
    commissions.filter(
      (commission) =>
        commission.status === "pending" ||
        commission.status === "invoiced"
    )



  const receivedCommissions =
    commissions.filter(
      (commission) =>
        commission.status === "received"
    )





  const pending =
    pendingCommissions.reduce(
      (sum, commission) =>
        sum + commission.amount,
      0
    )





  const received =
    receivedCommissions.reduce(
      (sum, commission) =>
        sum + commission.amount,
      0
    )





  const total =
    commissions.reduce(
      (sum, commission) =>
        sum + commission.amount,
      0
    )





  const upcoming =
    pendingCommissions
      .filter(
        (commission) =>
          commission.dueDate
      )
      .sort(
        (a,b) =>
          new Date(
            a.dueDate!
          ).getTime()
          -
          new Date(
            b.dueDate!
          ).getTime()
      )
      .slice(
        0,
        5
      )





  return {

    total,

    pending,

    received,

    count:
      commissions.length,


    pendingCount:
      pendingCommissions.length,


    receivedCount:
      receivedCommissions.length,


    upcoming,

  }

}