import { Building2 } from "lucide-react"

type PropertyImageProps = {
  image?: string
  name: string
}

export function PropertyImage({
  image,
  name,
}: PropertyImageProps) {
  if (image) {
    return (
      <img
        src={image}
        alt={name}
        className="h-32 w-44 rounded-2xl object-cover"
      />
    )
  }

  return (
    <div className="flex h-32 w-44 items-center justify-center rounded-2xl border border-dashed border-border bg-muted/40">
      <div className="flex flex-col items-center gap-2">
        <Building2 className="h-8 w-8 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          No Cover Image
        </span>
      </div>
    </div>
  )
}