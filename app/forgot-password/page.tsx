import {
  ForgotPasswordForm,
} from "@/components/auth/forgot-password-form"



export default function ForgotPasswordPage(){


  return (

    <main className="flex min-h-screen items-center justify-center bg-stone-50 p-6">


      <div className="w-full max-w-md space-y-8 rounded-2xl border bg-white p-8 shadow-sm">


        <div className="text-center">


          <h1 className="text-3xl font-semibold">
            Forgot Password?
          </h1>


          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email and we will send you a link to reset your password.
          </p>


        </div>





        <ForgotPasswordForm />



      </div>


    </main>

  )

}