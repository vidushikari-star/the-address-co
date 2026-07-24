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


import {
  Input,
} from "@/components/ui/input"


import {
  Button,
} from "@/components/ui/button"







export function ResetPasswordForm(){


  const router =
    useRouter()



  const [
    password,
    setPassword,
  ] =
  useState("")



  const [
    confirmPassword,
    setConfirmPassword,
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



    setMessage("")

    setError("")



    if(
      password !== confirmPassword
    ){

      setError(
        "Passwords do not match"
      )

      return

    }



    setLoading(true)





    const {
      error,
    } =
    await supabase.auth.updateUser({

      password,

    })






    if(error){

      setError(
        error.message
      )

      setLoading(false)

      return

    }





    setMessage(
      "Password updated successfully."
    )



    setTimeout(()=>{

      router.push(
        "/login"
      )

    },1500)



    setLoading(false)

  }







  return (

    <form

      onSubmit={submit}

      className="space-y-5"

    >



      <div className="space-y-2">

        <label className="text-sm font-medium">
          New Password
        </label>



        <div className="relative">


          <Input

            type={
              showPassword
                ? "text"
                : "password"
            }

            value={
              password
            }

            onChange={
              e =>
                setPassword(
                  e.target.value
                )
            }

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
              <EyeOff className="h-4 w-4"/>
              :
              <Eye className="h-4 w-4"/>
            }


          </button>


        </div>


      </div>






      <div className="space-y-2">

        <label className="text-sm font-medium">
          Confirm Password
        </label>


        <Input

          type="password"

          value={
            confirmPassword
          }

          onChange={
            e =>
              setConfirmPassword(
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
          "Updating..."
          :
          "Update Password"
        }


      </Button>



    </form>

  )

}