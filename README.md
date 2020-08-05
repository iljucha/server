# Server
Im tired of the *(req, res, next)*-middlewares.\
So I created another way of creating middlewares.

# Usage
```javascript
import { Server } from "@iljucha/server"

// create server and listen to port 3000
const app = new Server(3000)

// example for body-parsing
// incomingMessage is also known as "req", "request" and so on
function _body(incomingMessage){
    return new Promise((resolve, reject) => {
        let body = []
        incomingMessage.on("data", chunk => body.push(chunk) )
        incomingMessage.on("end", () => resolve(Buffer.concat(body).toString()))
        incomingMessage.on("error", error => reject(error))
    })
}

// true async, also nice middleware to slow down every connection (jk)
app.use(/[\S\s]*/, ctx => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            ctx.set("timeout-middleware", 5000)
            resolve()
        }, 5000)
    })
})

// create middleware for route "/4", fetch request body
app.use("/4", async ctx => ctx.set("body", await _body(ctx.incomingMessage)))

// very simple "hello world" - route
app.get("/", () => "hello world")

// synchronous return of requested method
app.get("/2", ctx => ctx.method)

// async route, fetch body
app.post("/3", async ctx => {
    let body = await _body(ctx.incomingMessage)
    console.log(body)
    return "thank you"
})

// sent request-body back to the client
app.post("/4", async ctx => ctx.get("body"))

app.get("/user/:alias", async ctx => {
    // ctx.get("_params")["alias"]
    return "Welcome, " + ctx.params.alias
})
```