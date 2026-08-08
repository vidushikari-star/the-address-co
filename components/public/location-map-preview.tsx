type Props = {
  location?: string
}


export function LocationMapPreview({
  location,
}: Props) {

if(!location){

  return null

}


return (

<div
className="
mt-2
"
>




<p
className="
mt-1
text-xs
text-muted-foreground
"
>

📍 Exact location shared after enquiry

</p>


</div>

)

}