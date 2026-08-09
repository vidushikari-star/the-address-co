import {
  ArrowDownRight,
  ArrowUpRight,
  LucideIcon,
} from "lucide-react"

import {
  DashboardCard,
  DashboardCardFooter,
  DashboardCardHeader,
} from "@/components/ui/dashboard-card"

import { cn } from "@/lib/utils"


type StatCardProps = {
  title: string
  value: string
  subtitle?: string
  trend?: "up" | "down" | "neutral"
  icon?: LucideIcon
}





export function StatCard({
  title,
  value,
  subtitle,
  trend = "neutral",
  icon: Icon,
}: StatCardProps) {


  return (

    <DashboardCard

      className="
        min-h-0
        overflow-hidden
      "

    >


      <DashboardCardHeader

        className="
          p-3
          sm:p-5
        "

      >


        <div className="min-w-0">


          <p className="
            truncate
            text-xs
            font-medium
            tracking-wide
            text-muted-foreground
            sm:text-sm
          ">

            {title}

          </p>




          <h3 className="
  mt-2
  text-xl
  font-semibold
  tracking-tight
  sm:mt-4
  sm:text-5xl
">

            {value}

          </h3>


        </div>





        {
          Icon && (

            <div className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-primary/10
              sm:h-12
              sm:w-12
              sm:rounded-2xl
            ">


              <Icon className="
                h-4
                w-4
                text-primary/80
                sm:h-5
                sm:w-5
              "/>


            </div>

          )
        }


      </DashboardCardHeader>






      {
        subtitle && (

          <DashboardCardFooter

            className="
              px-3
              pb-3
              pt-0
              sm:px-5
              sm:pb-5
            "

          >


            {
              trend === "up" && (

                <ArrowUpRight className="
                  h-3
                  w-3
                  text-emerald-700
                  dark:text-emerald-400
                  sm:h-4
                  sm:w-4
                "/>

              )
            }




            {
              trend === "down" && (

                <ArrowDownRight className="
                  h-3
                  w-3
                  text-rose-700
                  dark:text-rose-400
                  sm:h-4
                  sm:w-4
                "/>

              )
            }





            <span

              className={cn(
                "text-xs font-medium sm:text-sm",

                trend === "up" &&
                "text-emerald-700 dark:text-emerald-400",

                trend === "down" &&
                "text-rose-700 dark:text-rose-400",

                trend === "neutral" &&
                "text-muted-foreground"
              )}

            >

              {subtitle}

            </span>


          </DashboardCardFooter>

        )
      }
    </DashboardCard>

  )

}
