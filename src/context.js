// @ts-check
import { IncomingMessage, ServerResponse } from "http"
import { parse } from "url"

/**
 * @typedef {import("./types").Answer} Answer
 */

export class Context {
    /** @type {IncomingMessage} */
    #incomingMessage
    /** @type {ServerResponse} */
    #serverResponse
    /** @type {any} */
    #headers = {}
    /** @type {any} */
    #locals = {}

    /**
     * @param {IncomingMessage} incomingMessage 
     * @param {ServerResponse} serverResponse 
     */
    constructor(incomingMessage, serverResponse) {
        this.#incomingMessage = incomingMessage
        this.#serverResponse = serverResponse
    }

    get incomingMessage() {
        return this.#incomingMessage
    }

    get serverResponse() {
        return this.#serverResponse
    }

    /**
     * @param {string} key 
     * @param {any} value 
     * @returns {Context}
     */
    set(key, value) {
        this.#locals[key] = value
        return this
    }

    /**
     * @param {string} key 
     */
    get(key) {
        return this.#locals[key]
    }

    get params() {
        return this.#locals["_params"]
    }

    get ip() {
        return this.headers["x-forwarded-for"] || 
            this.incomingMessage.connection.remoteAddress || 
            this.incomingMessage.socket.remoteAddress || null
    }

    get query() {
        return { ...parse(this.url, true).query }
    }

    get url() {
        return this.incomingMessage.url || ""
    }

    get cleanUrl() {
        return this.url.split("?")[0] || this.url
    }

    get method() {
        return this.incomingMessage.method || ""
    }

    /**
     * @param {number} value
     * @returns {Context}
     */
    status(value) {
        this.serverResponse.statusCode = value
        return this
    }

    /**
     * @param {number} value
     * @returns {Context}
     */
    length(value) {
        this.header("Content-Length", value)
        return this
    }

    get headers() {
        return this.incomingMessage.headers
    }

    get cookies() {
        let rc = this.headers.cookie, cookies = {}, parts
        rc && rc.split(";").forEach(cookie => {
            parts = cookie.split("=")
            cookies[parts.shift().trim()] = decodeURI(parts.join("="))
        })
        return cookies
    }

    /**
     * @param {string} key 
     * @param {string} value 
     * @returns {Context}
     */
    cookie(key, value) {
        if (!Array.isArray(this.#headers["Set-Cookie"])) {
            this.#headers["Set-Cookie"] = []
        }
        this.#headers["Set-Cookie"].push(`${key}=${value};`)
        return this
    }

    /**
     * @param {string} value
     */
    redirect(value) {
        this.status(301).header("Location", value).end()
    }

    /**
     * @param {string} value
     */
    type(value) {
        return this.header("Content-Type", value)
    }

    /**
     * @param {string} value
     */
    cache(value) {
        return this.header("Cache-Control", value)
    }

    /**
     * @param {string} header 
     * @param {any} value 
     * @returns {Context}
     */
    header(header, value) {
        this.#headers[header] = value
        return this
    }

    /**
     * @param {string} [value] 
     */
    end(value) {
        if (!value) {
            value = ""
        }
        this.setHeaders()
        this.serverResponse.end(value)
    }

    /**
     * @private
     */
    setHeaders() {
        const hKeys = Object.keys(this.#headers)
        hKeys.map(hKey => this.serverResponse.setHeader(hKey, this.#headers[hKey]))
    }
}
