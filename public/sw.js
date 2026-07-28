const CACHE_NAME = "tac-shell-v4"


self.addEventListener(
  "install",
  (event)=>{

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




    event.respondWith(

      fetch(request)

      .then(
        response => {


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



          return response


        }
      )


      .catch(

        async ()=>{


          const cached =
            await caches.match(
              request
            )



          if(cached){

            return cached

          }



          return caches.match(
            "/"
          )


        }

      )

    )


  }
)