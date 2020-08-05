// @ts-check
import { createServer, IncomingMessage, ServerResponse } from "http"
import { Context } from "./context.js"
import { Route } from "./route.js"

/**
 * @typedef {import("./types").Answer} Answer
 * @typedef {import("./types").Path} Path
 * @typedef {import("./types").Handler} Handler
 */

export class Server {
    /** @type {Route[]} */
    #routes = []
    /** @type {Route[]} */
    #middlewares = []

    /**
     * @param {number} port 
     */
    constructor(port) {
        createServer((req, res) => this.listener(req, res)).listen(port)
    }

    /**
     * @public
     * @param {Path} path 
     * @param {Handler} handler 
     * @returns {Server}
     */
    use(path, handler) {
        this.#middlewares.push(new Route(null, path, handler))
        return this
    }

    /**
     * @public
     * @param {Path} path 
     * @param {Handler} handler 
     * @returns {Server}
     */
    all(path, handler) {
        return this.addRoute(null, path, handler)
    }

    /**
     * @public
     * @param {Path} path 
     * @param {Handler} handler 
     * @returns {Server}
     */
    get(path, handler) {
        return this.addRoute("GET", path, handler)
    }

    /**
     * @public
     * @param {Path} path 
     * @param {Handler} handler 
     * @returns {Server}
     */
    head(path, handler) {
        return this.addRoute("HEAD", path, handler)
    }

    /**
     * @public
     * @param {Path} path 
     * @param {Handler} handler 
     * @returns {Server}
     */
    post(path, handler) {
        return this.addRoute("POST", path, handler)
    }

    /**
     * @public
     * @param {Path} path 
     * @param {Handler} handler 
     * @returns {Server}
     */
    put(path, handler) {
        return this.addRoute("PUT", path, handler)
    }

    /**
     * @public
     * @param {Path} path 
     * @param {Handler} handler 
     * @returns {Server}
     */
    delete(path, handler) {
        return this.addRoute("DELETE", path, handler)
    }

    /**
     * @public
     * @param {Path} path 
     * @param {Handler} handler 
     * @returns {Server}
     */
    patch(path, handler) {
        return this.addRoute("PATCH", path, handler)
    }

    /**
     * @public
     * @param {Path} path 
     * @param {Handler} handler 
     * @returns {Server}
     */
    options(path, handler) {
        return this.addRoute("OPTIONS", path, handler)
    }

    /**
     * @private
     * @param {string} method 
     * @param {Path} path 
     * @param {Handler} handler
     * @returns {Server}
     */
    addRoute(method, path, handler) {
        this.#routes.push(new Route(method, path, handler))
        return this
    }

    /**
     * @private
     * @param {IncomingMessage} incomingMessage 
     * @param {ServerResponse} serverResponse 
     */
    async listener(incomingMessage, serverResponse) {
        /** @type {Answer} */
        let answer = "", error = false
        const ctx = new Context(incomingMessage, serverResponse)
        const route = this.#routes.find($ => $.match(ctx.method, ctx.cleanUrl))
        const middlewares = this.#middlewares.filter($ => $.match(null, ctx.cleanUrl))
        ctx.set("_params", route.params(ctx.cleanUrl))

        if (middlewares.length > 0) {
            try {
                for (let middleware of middlewares) {
                    await middleware.handler.call(null, ctx)
                }
            }
            catch (err) {
                console.error("MiddlewareError:", err)
                ctx.status(500)
                error = true
            }
        }

        if (!error) {
            if (route) {
                try {
                    answer = await route.handler.call(null, ctx) || ""
                }
                catch (err) {
                    console.error("RouteError:", err)
                    ctx.status(500)
                }
            }
            else {
                ctx.status(404)
            }
        }
        ctx.end(answer)
    }
}