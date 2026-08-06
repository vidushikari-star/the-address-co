export function isFollowUpDue(
  lastActivityAt?: string
){

  if(!lastActivityAt){

    return true

  }


  const diff =
    Date.now()
    -
    new Date(lastActivityAt).getTime()



  const days =
    diff /
    (
      1000 *
      60 *
      60 *
      24
    )


  return days >= 7

}