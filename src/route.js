// @ts-check
/**
 * @typedef {import("./types").Answer} Answer
 * @typedef {import("./types").Path} Path
 * @typedef {import("./types").Handler} Handler
 */

export class Route {
    /** @type {string} */
    #method
    /** @type {RegExp} */
    #path
    /** @type {Handler} */
    #handler

    /**
     * @param {string} method
     * @param {Path} path 
     * @param {Handler} handler 
     */
    constructor(method, path, handler) {
        this.#method = method
        this.#handler = handler
        if (typeof path === "string") {
            this.#path = new RegExp("^" + path.replace(/\:([a-zA-Z]+)/gi, "(?<$1>[^\\/\\:\\?]+?)") + "/?$")
        }
        else if (path instanceof RegExp) {
            this.#path = path
        }
        else {
            throw new Error(`RoutePath can only be RegExp or string but is ${typeof path}.`)
        }
    }

    /**
     * @param {string} method 
     * @param {string} url 
     */
    match(method, url) {
        return this.path.test(url) && (this.method === method)
    }

    /**
     * @param {string} url 
     */
    params(url) {
        url = url.split("?")[0] || url
        const match = this.path.exec(url)
        if (match && match.groups) {
            return { ...match.groups }
        }
        return { }
    }

    get path() {
        return this.#path
    }

    get method() {
        return this.#method
    }

    get handler() {
        return this.#handler
    }
}