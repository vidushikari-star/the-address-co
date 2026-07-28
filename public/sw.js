const CACHE_NAME = "tac-shell-v6"

const APP_SHELL = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png",
]

self.addEventListener(
  "install",
  (event)=>{

    event.waitUntil(

      caches.open(
        CACHE_NAME
      )
      .then(
        cache =>
          cache.addAll(
            APP_SHELL
          )
      )

    )


    self.skipWaiting()

  }
)





self.addEventListener(
  "activate",
  (event)=>{

    event.waitUntil(

      caches.keys()
      .then(
        keys =>
          Promise.all(
            keys.map(
              key => {

                if(
                  key !== CACHE_NAME
                ){

                  return caches.delete(key)

                }

              }
            )
          )
      )

    )


    self.clients.claim()

  }
)







self.addEventListener(
  "fetch",
  (event)=>{


    const request =
      event.request



    if(
      request.method !== "GET"
    ){

      return

    }




    /*
      Navigation requests
      */

    if(
      request.mode === "navigate"
    ){

      event.respondWith(

        fetch(request)

        .catch(
          async ()=>{


            const cached =
              await caches.match("/")


            if(cached){

              return cached

            }


            return new Response(
              "Offline",
              {
                status:503,
                headers:{
                  "Content-Type":
                    "text/plain"
                }
              }
            )

          }

        )

      )


      return

    }







    /*
      Static assets
      */

    event.respondWith(

      caches.match(request)

      .then(
        cached => {


          if(cached){

            return cached

          }



          return fetch(request)

          .then(
            response=>{


              if(
                response.status === 200
              ){

                const copy =
                  response.clone()



                caches.open(
                  CACHE_NAME
                )
                .then(
                  cache =>
                    cache.put(
                      request,
                      copy
                    )
                )

              }



              return response

            }

          )


        }

      )

    )


  }

)