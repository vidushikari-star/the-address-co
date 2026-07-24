import {
  ResetPasswordForm,
} from "@/components/auth/reset-password-form"



export default function ResetPasswordPage(){


  return (

    <main className="flex min-h-screen items-center justify-center bg-stone-50 p-6">


      <div className="w-full max-w-md space-y-8 rounded-2xl border bg-white p-8 shadow-sm">


        <div className="text-center">


          <h1 className="text-3xl font-semibold">
            Set New Password
          </h1>


          <p className="mt-2 text-sm text-muted-foreground">
            Create a new password for your account.
          </p>


        </div>





        <ResetPasswordForm />



      </div>


    </main>

  )

}