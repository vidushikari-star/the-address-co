"use client"


import {
  useState,
} from "react"


import {
  supabase,
} from "@/lib/supabase/client"


import {
  Input,
} from "@/components/ui/input"


import {
  Button,
} from "@/components/ui/button"





export function ForgotPasswordForm(){


  const [
    email,
    setEmail,
  ] =
  useState("")



  const [
    loading,
    setLoading,
  ] =
  useState(false)



  const [
    message,
    setMessage,
  ] =
  useState("")



  const [
    error,
    setError,
  ] =
  useState("")







  async function submit(
    e:React.FormEvent
  ){

    e.preventDefault()


    setLoading(true)

    setMessage("")

    setError("")



    const {
      error,
    } =
    await supabase.auth.resetPasswordForEmail(

      email,

      {
        redirectTo:
          `${window.location.origin}/reset-password`,
      }

    )





    if(error){

      setError(
        error.message
      )

    }else{

      setMessage(
        "Password reset link sent. Check your email."
      )

    }


    setLoading(false)

  }







  return (

    <form

      onSubmit={submit}

      className="space-y-5"

    >


      <div className="space-y-2">

        <label className="text-sm font-medium">
          Email
        </label>


        <Input

          type="email"

          placeholder="you@example.com"

          value={email}

          onChange={
            e =>
              setEmail(
                e.target.value
              )
          }

          required

        />

      </div>






      {
        message && (

          <p className="text-sm text-green-600">

            {message}

          </p>

        )
      }





      {
        error && (

          <p className="text-sm text-red-600">

            {error}

          </p>

        )
      }





      <Button

        className="w-full"

        disabled={
          loading
        }

      >

        {
          loading
            ?
            "Sending..."
            :
            "Send Reset Link"
        }

      </Button>


    </form>

  )

}