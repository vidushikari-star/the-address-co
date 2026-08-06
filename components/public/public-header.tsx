import Link from "next/link"


export function PublicHeader(){

  return (

    <header
      className="
        fixed
        left-0
        right-0
        top-0
        z-50
        px-5
        py-5
      "
    >

      <div
        className="
          mx-auto
          flex
          max-w-7xl
          items-center
          justify-between
        "
      >

        <Link
          href="/"
          className="
            flex
            items-center
            gap-3
          "
        >

          <div
            className="
              flex
              h-11
              w-11
              items-center
              justify-center
              rounded-xl
              bg-white
              text-[#1F4D3B]
              shadow-lg
            "
          >

            <span
              className="
                text-xl
                font-semibold
              "
            >
              A
            </span>

          </div>


          <div
            className="
              leading-none
              text-white
            "
          >

            <div
              className="
                text-sm
                font-semibold
                tracking-[0.18em]
              "
            >
              THE ADDRESS CO.
            </div>


            <div
              className="
                mt-1
                text-xs
                text-white/70
              "
            >
              Luxury Real Estate
            </div>


          </div>


        </Link>




        <Link

          href="#enquiry"

          className="
            rounded-full
            border
            border-white/40
            bg-white/10
            px-5
            py-2
            text-sm
            font-medium
            text-white
            backdrop-blur
            transition
            hover:bg-white
            hover:text-[#1F4D3B]
          "

        >

          Enquire

        </Link>


      </div>


    </header>

  )

}