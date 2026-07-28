export default function OfflinePage(){

  return (

    <div className="min-h-screen flex items-center justify-center">

      <div className="text-center space-y-3">

        <h1 className="text-2xl font-semibold">
          The Address Co.
        </h1>

        <p>
          You are currently offline.
        </p>

        <p className="text-sm text-muted-foreground">
          Your saved data will sync automatically when internet returns.
        </p>

      </div>

    </div>

  )

}