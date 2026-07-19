import { getInitials } from "@/lib/formatters/initials"

type AvatarSize = "sm" | "md" | "lg"

type AvatarProps = {
  name: string
  size?: AvatarSize
}

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-10 w-10 text-sm rounded-xl",
  md: "h-12 w-12 text-base rounded-2xl",
  lg: "h-14 w-14 text-lg rounded-2xl",
}

export function Avatar({
  name,
  size = "lg",
}: AvatarProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-primary/10 font-semibold text-primary ${sizeClasses[size]}`}
    >
      {getInitials(name)}
    </div>
  )
}