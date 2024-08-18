const HEADERS = {
    contentType: {
        name: "Content-Type",
        values: {
            text: "text/plain",
            json: "application/json",
            html: "text/html",
        },
    },
};
/** @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#information_responses} */
export const statusCodes = {
    Continue: 100,
    SwitchingProtocols: 101,
    Processing: 102,
    EarlyHints: 103,
    Ok: 200,
    Created: 201,
    Accepted: 202,
    NonAuthoritativeInformation: 203,
    NoContent: 204,
    ResetContent: 205,
    PartialContent: 206,
    MultiStatus: 207,
    AlreadyReported: 208,
    IMUsed: 226,
    MultipleChoises: 300,
    MovedPermanently: 301,
    Found: 302,
    SeeOther: 303,
    NotModified: 304,
    TemporaryRedirect: 307,
    PermanentRedirect: 308,
    BadRequest: 400,
    Unauthorized: 401,
    PaymentRequired: 402,
    Forbidden: 403,
    NotFound: 404,
    MethodNotAllowed: 405,
    NotAcceptable: 406,
    ProxyAuthenticationRequired: 407,
    RequestTimeout: 408,
    Conflict: 409,
    Gone: 410,
    LengthRequired: 411,
    PreconditionFailed: 412,
    PayloadTooLarge: 413,
    URITooLong: 414,
    UnsupportedMediaType: 415,
    RangeNotSatisfiable: 416,
    ExpectationFailed: 417,
    ImATeapot: 418,
    MisdirectedRequest: 421,
    UnprocessableContent: 422,
    Locked: 423,
    FailedDependency: 424,
    TooEarly: 425,
    UpgrageRequired: 426,
    PreconditionRequired: 428,
    TooManyRequests: 429,
    RequestHeaderFieldsTooLarge: 431,
    UnavailableForLegalReasons: 451,
    InternalServerError: 500,
    NotImplemented: 501,
    BadGateway: 502,
    ServiceUnavailable: 503,
    GatewayTimeout: 504,
    HTTPVersionNotSupported: 505,
    VariantAlsoNegotiates: 506,
    InsufficientStorage: 507,
    LoopDetected: 508,
    NotExtended: 510,
    NetworkAuthenticationRequired: 511,
};
class Stream {
    server;
    response;
    streamFunction;
    onDataListeners = [];
    onCloseListeners = [];
    constructor(
    //@ts-expect-error Its unused for now
    server, response, streamFunction) {
        this.server = server;
        this.response = response;
        this.streamFunction = streamFunction;
    }
    /**
     * Creates an event listener that fires when data is sent through the
     * stream, before the data gets sent to the client.
     */
    onData(listener) {
        this.onDataListeners.push(listener);
    }
    /**
     * Creates an event listener that fires when the stream is closed, before
     * the stream closes for the client.
     */
    onClose(listener) {
        this.onCloseListeners.push(listener);
    }
    /** **ONLY FOR INTERNAL USE** */
    async start() {
        this.streamFunction(this);
    }
    /**
     * Writes a chunk to the response, returns a promise that resolves when the
     * client has handled the chunk
     *
     * @example
     *     stream.write("Hello World!"); // Send chunk
     *     stream.close(); // End connection
     */
    async write(chunk) {
        for (const dataListener of this.onDataListeners) {
            await dataListener(chunk);
        }
        return new Promise((resolve, reject) => {
            this.response.write(chunk, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    /**
     * Closes the stream, after this nothing more can be written to it. Before
     * it gets closed all middleware {@link onClose} events will be called
     */
    async close() {
        for (const closeListener of this.onCloseListeners) {
            await closeListener();
        }
        return new Promise((resolve) => {
            this.response.end(() => {
                resolve();
            });
        });
    }
    /** A promise that resolves after the delay */
    sleep(delayMs) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, delayMs);
        });
    }
}
export class Response {
    server;
    response;
    stream;
    content;
    constructor(server, response) {
        this.server = server;
        this.response = response;
    }
    /**
     * Set one header on the response. To set multiple at the same time use the
     * {@link headers} method.
     *
     * @example
     *     response.header("Content-Type", "text/plain");
     */
    header(name, value) {
        this.response.setHeader(name, value);
        return this;
    }
    /** Set multiple headers at once and overwrides existing ones. */
    headers(headers) {
        for (const [name, value] of Object.entries(headers)) {
            this.response.setHeader(name, value);
        }
        return this;
    }
    /**
     * Sets the status code of the response
     *
     * @example
     *     response.status(404); // Not found
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status}
     */
    status(statusCode) {
        this.response.statusCode = statusCode;
        return this;
    }
    /**
     * Sets a cookie on the response headers.
     *
     * @example
     *     response.cookie("session", "abc123");
     *     response.cookie("session", "abc123", { ...options });
     *
     * @example
     *     router.get("/").handle(({ request, response }) => {
     *         const welcommedBefore =
     *             request.cookies.get("welcommed") !== undefined;
     *         response.cookie("welcommed", "true");
     *
     *         return response.ok().json({
     *             message: welcommedBefore
     *                 ? "Hello again!"
     *                 : "Welcome to my site!",
     *         });
     *     });
     *
     * @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie}
     */
    cookie(name, value, options) {
        let optionsString = "";
        if (options) {
            optionsString += options.domail ? `; Domail=${options.domail}` : "";
            optionsString += options.expires
                ? `; Expires=${options.expires}`
                : "";
            optionsString += options.httpOnly ? `; HttpOnly` : "";
            optionsString += options.maxAge ? `; MaxAge=${options.maxAge}` : "";
            optionsString += options.partitioned ? `; Partitioned` : "";
            optionsString += options.path ? `; Path=${options.path}` : "";
            optionsString += options.sameSite
                ? `; SameSite=${options.sameSite}`
                : "";
            optionsString += options.secure ? `; Secure` : "";
        }
        this.header("Set-Cookie", `${name}=${value}${optionsString}`);
        return this;
    }
    /**
     * Creates a stream object and passes it to the callback function. The
     * `stream` streams data back to the client and can be used alongside
     * middleware.
     *
     * @example
     *     response.streamResponse(async (stream) => {
     *         let i = 0;
     *         while (i < 10) {
     *             await stream.write(`${i}\n`);
     *             await stream.sleep(10); // 10 ms
     *             i++;
     *         }
     *         await stream.close();
     *     });
     */
    streamResponse(streamFunction) {
        if (this.stream)
            throw "Only one stream per response!";
        this.stream = new Stream(this.server, this.response, streamFunction);
    }
    /**
     * Sets the response body, will only be sent to the client after it has gone
     * through all the middleware.
     */
    body(body) {
        this.content = body;
    }
    /** Same as {@link body} but sets the `Content-Type` header to `text/plain` */
    text(body) {
        this.header(HEADERS.contentType.name, HEADERS.contentType.values.text);
        this.body(body);
    }
    /**
     * Same as {@link body} but sets the `Content-Type` header to
     * `application/json`
     */
    json(body) {
        this.header(HEADERS.contentType.name, HEADERS.contentType.values.json);
        this.body(JSON.stringify(body));
    }
    /** Same as {@link body} but sets the `Content-Type` header to `text/html` */
    html(body) {
        this.header(HEADERS.contentType.name, HEADERS.contentType.values.html);
        this.body(body);
    }
    /**
     * Responds with a redirection response to the client. Use one of the
     * redirect http codes `3**`. It also sets the `Location` response header.
     *
     * @example
     *     router.get("/protected").handle(({ request, response }) => {
     *         if (!isAuthenticated()) {
     *             response.redirect(303, "/login");
     *             return;
     *         }
     *     });
     *
     * @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Redirections}
     */
    redirect(code, location) {
        this.status(code);
        this.header("Location", location);
    }
    /**
     * Sets the status code to `200` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200}
     */
    ok() {
        this.status(statusCodes.Ok);
        return this;
    }
    /**
     * Sets the status code to `201` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/201}
     */
    created() {
        this.status(statusCodes.Created);
        return this;
    }
    /**
     * Sets the status code to `400` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400}
     */
    badRequest() {
        this.status(statusCodes.BadRequest);
        return this;
    }
    /**
     * Sets the status code to `401` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401}
     */
    unauthorized() {
        this.status(statusCodes.Unauthorized);
        return this;
    }
    /**
     * Sets the status code to `403` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403}
     */
    forbidden() {
        this.status(statusCodes.Forbidden);
        return this;
    }
    /**
     * Sets the status code to `404` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404}
     */
    notFound() {
        this.status(statusCodes.NotFound);
        return this;
    }
    /**
     * Sets the status code to `422` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422}
     */
    unprocessableContent() {
        this.status(statusCodes.UnprocessableContent);
        return this;
    }
    /**
     * Sets the status code to `429` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429}
     */
    tooManyRequests() {
        this.status(statusCodes.TooManyRequests);
        return this;
    }
    /**
     * Sets the status code to `500` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500}
     */
    internalServerError() {
        this.status(statusCodes.InternalServerError);
        return this;
    }
    /**
     * Sets the status code to `501` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501}
     */
    notImplemented() {
        this.status(statusCodes.NotImplemented);
        return this;
    }
}
