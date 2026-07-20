import { supabase } from "@/lib/supabase/client"

export default async function TestPage() {
  const { data, error } = await supabase.auth.getSession()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Supabase Test</h1>

      <pre className="mt-6 whitespace-pre-wrap">
        {JSON.stringify(
          {
            connected: !error,
            error,
            session: data.session,
          },
          null,
          2
        )}
      </pre>
    </div>
  )
}