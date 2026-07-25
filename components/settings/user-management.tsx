"use client"


import type {
  UserProfile,
} from "@/types/user"





type Props = {

  users:UserProfile[]

}





export function UserManagement({

  users,

}:Props){


  return (

    <div className="rounded-2xl border overflow-hidden">


      <table className="w-full text-sm">


        <thead className="bg-muted">

          <tr>

            <th className="p-4 text-left">
              Name
            </th>


            <th className="p-4 text-left">
              Email
            </th>


            <th className="p-4 text-left">
              Role
            </th>


            <th className="p-4 text-left">
              Joined
            </th>

          </tr>

        </thead>



        <tbody>

        {
          users.map(
            user => (

              <tr
                key={user.id}
                className="border-t"
              >

                <td className="p-4 font-medium">
                  {user.name}
                </td>


                <td className="p-4">
                  {user.email ?? "-"}
                </td>


                <td className="p-4 capitalize">
                  {user.role}
                </td>


                <td className="p-4">
  {
    new Date(
      user.createdAt
    ).toLocaleDateString(
      "en-GB"
    )
  }
</td>


              </tr>

            )
          )
        }


        </tbody>


      </table>


    </div>

  )

}