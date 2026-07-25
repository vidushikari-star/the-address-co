type Props = {

  title:string

  value:string

  description?:string

}


export function ReportCard({

  title,

  value,

  description,

}:Props){

  return (

    <div className="rounded-2xl border p-6 space-y-2">

      <p className="text-sm text-muted-foreground">
        {title}
      </p>


      <h3 className="text-2xl font-semibold">
        {value}
      </h3>


      {
        description && (

          <p className="text-xs text-muted-foreground">
            {description}
          </p>

        )
      }


    </div>

  )

}