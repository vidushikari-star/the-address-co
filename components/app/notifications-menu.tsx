"use client"

import {
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
} from "lucide-react"

import {
  useRouter,
} from "next/navigation"

import {
  Button,
} from "@/components/ui/button"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import type {
  AppNotification,
} from "@/lib/services/notification-service"


type Props = {
  notifications: AppNotification[]
}


export function NotificationsMenu({
  notifications,
}: Props){
  const router = useRouter()

  const notificationCount =
    notifications.length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="icon-lg"
            aria-label={
              notificationCount > 0
                ? `${notificationCount} actionable notifications`
                : "Notifications"
            }
            className="relative rounded-full"
          />
        }
      >
        <Bell className="h-4 w-4" />

        {
          notificationCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-background bg-destructive px-1 text-[10px] font-bold leading-none text-white">
              {
                notificationCount > 9
                  ? "9+"
                  : notificationCount
              }
            </span>
          )
        }
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[min(23rem,calc(100vw-2rem))] overflow-hidden p-0"
      >
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            Notifications
          </p>

          <span className="text-xs text-muted-foreground">
            {notificationCount} requiring attention
          </span>
        </div>

        <DropdownMenuSeparator />

        {
          notificationCount === 0
            ? (
              <div className="flex flex-col items-center px-5 py-9 text-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />

                <p className="mt-3 text-sm font-medium">
                  You&apos;re all caught up
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  There are no due tasks or follow-ups right now.
                </p>
              </div>
            )
            : (
              <div className="max-h-[min(28rem,calc(100vh-10rem))] overflow-y-auto p-1.5">
                {
                  notifications.map(
                    notification => (
                      <DropdownMenuItem
                        key={notification.id}
                        onClick={() =>
                          router.push(
                            notification.href
                          )
                        }
                        className="items-start gap-3 rounded-xl px-3 py-3"
                      >
                        <span className={
                          notification.tone === "urgent"
                            ? "mt-0.5 rounded-full bg-destructive/10 p-1.5 text-destructive"
                            : "mt-0.5 rounded-full bg-primary/10 p-1.5 text-primary"
                        }>
                          <CircleAlert className="h-3.5 w-3.5" />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {notification.title}
                          </span>

                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {notification.description}
                          </span>
                        </span>

                        <ChevronRight className="mt-1 h-4 w-4 text-muted-foreground" />
                      </DropdownMenuItem>
                    )
                  )
                }
              </div>
            )
        }

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => router.push("/tasks")}
          className="justify-center py-2.5 text-sm font-medium text-primary"
        >
          View all tasks
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
