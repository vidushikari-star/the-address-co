import { cn } from "@/lib/utils"

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({
  children,
  className,
}: PageContainerProps) {

  return (

    <main
      className={cn(
        `
        mx-auto
        flex
        w-full
        max-w-[1600px]
        flex-col
        gap-6
        px-4
        py-4
        sm:px-6
        sm:py-6
        lg:gap-8
        lg:p-8
        `,
        className
      )}
    >

      {children}

    </main>

  )

}