"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import {
Sidebar,
SidebarContent,
SidebarFooter,
SidebarGroup,
SidebarGroupContent,
SidebarGroupLabel,
SidebarHeader,
SidebarMenu,
SidebarMenuButton,
SidebarMenuItem,
SidebarRail,
useSidebar,
} from "@/components/ui/sidebar"

import { AppLogo } from "@/components/app/app-logo"
import { UserNav } from "@/components/app/user-nav"

import {
navigation,
type UserRole,
} from "@/lib/navigation"


type AppSidebarProps = {
role?: UserRole

user?: {
name: string
email: string
image?: string
}

}



export function AppSidebar({
role = "admin",
user,
}: AppSidebarProps){


const pathname =
usePathname()


const {
setOpenMobile,
} =
useSidebar()



const groups =
navigation

.map(
group => ({

...group,

items:
group.items.filter(
item =>
item.roles.includes(role)
),

})
)

.filter(
group =>
group.items.length > 0
)



function handleNavigation(){

setOpenMobile(false)

}



return (

<Sidebar

collapsible="icon"

variant="inset"

side="left"

>



<SidebarHeader className="
border-b
border-sidebar-border
px-5
py-4
">

<AppLogo />

</SidebarHeader>





<SidebarContent className="py-2">


{
groups.map(
group => (

<SidebarGroup

key={
group.title
}

className="py-2"

>


<SidebarGroupLabel className="
mb-2
text-xs
font-medium
uppercase
tracking-[0.14em]
text-muted-foreground/80
">

{group.title}

</SidebarGroupLabel>





<SidebarGroupContent>

<SidebarMenu>


{
group.items.map(
item => {


const isActive =
pathname === item.href ||
pathname.startsWith(
item.href + "/"
)



const Icon =
item.icon



return (

<SidebarMenuItem

key={
item.href
}

>


<SidebarMenuButton

isActive={
isActive
}

render={
<Link
href={item.href}
onClick={
handleNavigation
}
/>
}

>


<Icon className="h-4 w-4" />

<span>
{item.title}
</span>


</SidebarMenuButton>


</SidebarMenuItem>

)


}

)

}


</SidebarMenu>


</SidebarGroupContent>


</SidebarGroup>


)

)

}


</SidebarContent>





<SidebarFooter className="
border-t
border-sidebar-border
p-2
">


<UserNav

name={
user?.name ?? ""
}

email={
user?.email ?? ""
}

image={
user?.image
}

role={
role
}

/>


</SidebarFooter>





<SidebarRail />


</Sidebar>

)

}