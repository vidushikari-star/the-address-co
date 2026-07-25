"use client"

import {
  useState,
} from "react"



type Props = {

  onChange:(range:string)=>void

}





export function ReportFilter({

  onChange,

}:Props){


  const [
    value,
    setValue,
  ] =
  useState("all")




  function change(
    newValue:string
  ){

    setValue(
      newValue
    )

    onChange(
      newValue
    )

  }





  return (

    <select

      className="rounded-lg border px-4 py-2 text-sm"

      value={
        value
      }

      onChange={
        e =>
          change(
            e.target.value
          )
      }

    >

      <option value="all">
        All Time
      </option>


      <option value="month">
        This Month
      </option>


      <option value="last_month">
        Last Month
      </option>


      <option value="quarter">
        This Quarter
      </option>


      <option value="year">
        This Year
      </option>


    </select>

  )

}