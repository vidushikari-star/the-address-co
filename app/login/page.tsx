"use client"

import {
  useState,
} from "react"

import {
  useRouter,
} from "next/navigation"

import {
  supabase,
} from "@/lib/supabase/client"

import {
  Button,
} from "@/components/ui/button"

import {
  Input,
} from "@/components/ui/input"



export default function LoginPage(){


  const router =
    useRouter()



  const [
    email,
    setEmail,
  ] =
  useState("")



  const [
    password,
    setPassword,
  ] =
  useState("")



  const [
    loading,
    setLoading,
  ] =
  useState(false)



  const [
    error,
    setError,
  ] =
  useState("")







  async function login(
    e:React.FormEvent
  ){

    e.preventDefault()


    console.log(
      "LOGIN CLICKED"
    )


    setLoading(true)

    setError("")



    const {
      data,
      error,
    } =
    await supabase.auth.signInWithPassword({

      email,

      password,

    })



    console.log(
      "LOGIN RESPONSE",
      {
        data,
        error,
      }
    )



    if(error){


      console.error(
        error
      )


      setError(
        error.message
      )


      setLoading(false)


      return

    }



    router.push(
      "/dashboard"
    )


    router.refresh()


  }







  return (

    <div className="flex min-h-screen items-center justify-center p-6">


      <form

        onSubmit={
          login
        }

        className="w-full max-w-md space-y-5 rounded-2xl border p-8"

      >


        <h1 className="text-2xl font-semibold">
          Login
        </h1>




        <Input

          placeholder="Email"

          type="email"

          value={
            email
          }

          onChange={
            e =>
              setEmail(
                e.target.value
              )
          }

        />





        <Input

          placeholder="Password"

          type="password"

          value={
            password
          }

          onChange={
            e =>
              setPassword(
                e.target.value
              )
          }

        />





        {
          error && (

            <p className="text-sm text-destructive">

              {error}

            </p>

          )
        }






        <Button

          type="submit"

          className="w-full"

          disabled={
            loading
          }

        >

          {
            loading
            ?
            "Logging in..."
            :
            "Login"
          }


        </Button>



      </form>


    </div>

  )

}