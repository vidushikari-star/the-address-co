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
  Eye,
  EyeOff,
} from "lucide-react"

import Link from "next/link"

import {
  Button,
} from "@/components/ui/button"

import {
  Input,
} from "@/components/ui/input"





export function LoginForm(){


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
    showPassword,
    setShowPassword,
  ] =
  useState(false)



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






  async function submit(
    e:React.FormEvent
  ){

    e.preventDefault()



    setLoading(true)

    setError("")



    const {
      error,
    } =
    await supabase.auth.signInWithPassword({

      email,

      password,

    })





    if(error){

      setError(
        "Invalid email or password"
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

          value={email}

          onChange={
            e =>
              setEmail(
                e.target.value
              )
          }

          placeholder="you@example.com"

          required

        />

      </div>





      <div className="space-y-2">

        <label className="text-sm font-medium">
          Password
        </label>



        <div className="relative">


          <Input

            type={
              showPassword
                ? "text"
                : "password"
            }

            value={password}

            onChange={
              e =>
                setPassword(
                  e.target.value
                )
            }

            placeholder="Enter password"

            required

          />



          <button

            type="button"

            onClick={() =>
              setShowPassword(
                !showPassword
              )
            }

            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"

          >

            {
              showPassword
                ?
                <EyeOff className="h-4 w-4" />
                :
                <Eye className="h-4 w-4" />
            }


          </button>


        </div>


      </div>






      {
        error && (

          <p className="text-sm text-red-600">

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
            "Signing in..."
            :
            "Login"
        }


      </Button>







      <div className="text-center text-sm">


        <Link

          href="/forgot-password"

          className="text-muted-foreground hover:underline"

        >

          Forgot password?

        </Link>


      </div>




    </form>

  )

}