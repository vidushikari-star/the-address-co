import {
  Home,
  FileText,
  MessageCircle,
} from "lucide-react"


import {
  DashboardCard,
  DashboardCardContent,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"



type Activity = {

  time:string

  title:string

  description?:string

  type:
    | "client"
    | "property"
    | "document"
    | "commission"

}



type Props = {

  activities:Activity[]

}




function ActivityIcon({
  title
}:{
  title:string
}){


  if(
    title.toLowerCase().includes("whatsapp")
  )
    return <MessageCircle className="h-4 w-4"/>


  if(
    title.toLowerCase().includes("deal")
  )
    return <FileText className="h-4 w-4"/>


  return <Home className="h-4 w-4"/>

}



export function ActivityFeed({
  activities,
}:Props){


return (

<DashboardCard>


<DashboardCardHeader>

<p className="text-sm text-muted-foreground">
Recent Activity
</p>

<h3 className="mt-2 text-2xl font-semibold">
Today
</h3>

</DashboardCardHeader>



<DashboardCardContent>


<div className="space-y-6">


{
activities.slice(0,8).map(
activity=>(


<div
key={`${activity.title}-${activity.time}`}
>


<div className="rounded-full border p-2 h-fit">

<ActivityIcon
title={activity.title}
/>

</div>



<div className="flex-1">


<div className="flex justify-between gap-4">

<h4 className="font-medium">
{activity.title}
</h4>


<span className="text-xs text-muted-foreground whitespace-nowrap">

{
activity.time
}

</span>


</div>



<p className="mt-1 text-sm text-muted-foreground">

{
activity.description
}

</p>


</div>



</div>


)
)

}


</div>


</DashboardCardContent>


</DashboardCard>

)

}