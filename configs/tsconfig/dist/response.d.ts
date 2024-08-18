import http from "http";
import type { Method, Path } from "./router.js";
import type { Server } from "./server.js";
export type InfoStatusCode = 100 | 101 | 102 | 103;
export type SuccessStatusCode = 200 | 201 | 202 | 203 | 204 | 205 | 206 | 207 | 208 | 226;
export type RedirectStatusCode = 300 | 301 | 302 | 303 | 304 | 307 | 308;
export type ClientErrorStatusCode = 400 | 401 | 402 | 403 | 404 | 405 | 406 | 407 | 408 | 409 | 410 | 411 | 412 | 413 | 414 | 415 | 416 | 417 | 418 | 421 | 422 | 423 | 424 | 425 | 426 | 428 | 429 | 431 | 451;
export type ServerErrorStatusCode = 500 | 501 | 502 | 503 | 504 | 505 | 506 | 507 | 508 | 510 | 511;
export type StatusCode = InfoStatusCode | SuccessStatusCode | RedirectStatusCode | ClientErrorStatusCode | ServerErrorStatusCode;
/** @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status#information_responses} */
export declare const statusCodes: {
    readonly Continue: 100;
    readonly SwitchingProtocols: 101;
    readonly Processing: 102;
    readonly EarlyHints: 103;
    readonly Ok: 200;
    readonly Created: 201;
    readonly Accepted: 202;
    readonly NonAuthoritativeInformation: 203;
    readonly NoContent: 204;
    readonly ResetContent: 205;
    readonly PartialContent: 206;
    readonly MultiStatus: 207;
    readonly AlreadyReported: 208;
    readonly IMUsed: 226;
    readonly MultipleChoises: 300;
    readonly MovedPermanently: 301;
    readonly Found: 302;
    readonly SeeOther: 303;
    readonly NotModified: 304;
    readonly TemporaryRedirect: 307;
    readonly PermanentRedirect: 308;
    readonly BadRequest: 400;
    readonly Unauthorized: 401;
    readonly PaymentRequired: 402;
    readonly Forbidden: 403;
    readonly NotFound: 404;
    readonly MethodNotAllowed: 405;
    readonly NotAcceptable: 406;
    readonly ProxyAuthenticationRequired: 407;
    readonly RequestTimeout: 408;
    readonly Conflict: 409;
    readonly Gone: 410;
    readonly LengthRequired: 411;
    readonly PreconditionFailed: 412;
    readonly PayloadTooLarge: 413;
    readonly URITooLong: 414;
    readonly UnsupportedMediaType: 415;
    readonly RangeNotSatisfiable: 416;
    readonly ExpectationFailed: 417;
    readonly ImATeapot: 418;
    readonly MisdirectedRequest: 421;
    readonly UnprocessableContent: 422;
    readonly Locked: 423;
    readonly FailedDependency: 424;
    readonly TooEarly: 425;
    readonly UpgrageRequired: 426;
    readonly PreconditionRequired: 428;
    readonly TooManyRequests: 429;
    readonly RequestHeaderFieldsTooLarge: 431;
    readonly UnavailableForLegalReasons: 451;
    readonly InternalServerError: 500;
    readonly NotImplemented: 501;
    readonly BadGateway: 502;
    readonly ServiceUnavailable: 503;
    readonly GatewayTimeout: 504;
    readonly HTTPVersionNotSupported: 505;
    readonly VariantAlsoNegotiates: 506;
    readonly InsufficientStorage: 507;
    readonly LoopDetected: 508;
    readonly NotExtended: 510;
    readonly NetworkAuthenticationRequired: 511;
};
interface CookieOptions {
    domail: string;
    expires: Date;
    httpOnly: boolean;
    maxAge: number;
    partitioned: boolean;
    path: string;
    sameSite: "Strict" | "Lax" | "None";
    secure: boolean;
}
type StreamDataEventListener = (chunk: string) => Promise<void> | void;
type StreamCloseEventListener = () => Promise<void> | void;
export type JsonValue = string | number | boolean | null | undefined | JsonValue[] | {
    [key: string]: JsonValue;
};
declare class Stream<R extends Path | null, M extends Method[] | null> {
    private readonly server;
    private readonly response;
    private readonly streamFunction;
    private onDataListeners;
    private onCloseListeners;
    constructor(server: Server, response: http.ServerResponse, streamFunction: (stream: Stream<R, M>) => Promise<void> | void);
    /**
     * Creates an event listener that fires when data is sent through the
     * stream, before the data gets sent to the client.
     */
    onData(listener: StreamDataEventListener): void;
    /**
     * Creates an event listener that fires when the stream is closed, before
     * the stream closes for the client.
     */
    onClose(listener: StreamCloseEventListener): void;
    /** **ONLY FOR INTERNAL USE** */
    start(): Promise<void>;
    /**
     * Writes a chunk to the response, returns a promise that resolves when the
     * client has handled the chunk
     *
     * @example
     *     stream.write("Hello World!"); // Send chunk
     *     stream.close(); // End connection
     */
    write(chunk: string): Promise<void>;
    /**
     * Closes the stream, after this nothing more can be written to it. Before
     * it gets closed all middleware {@link onClose} events will be called
     */
    close(): Promise<void>;
    /** A promise that resolves after the delay */
    sleep(delayMs: number): Promise<void>;
}
export declare class Response<R extends Path | null, M extends Method[] | null> {
    private readonly server;
    private readonly response;
    stream: Stream<R, M> | undefined;
    content: string | undefined;
    constructor(server: Server, response: http.ServerResponse);
    /**
     * Set one header on the response. To set multiple at the same time use the
     * {@link headers} method.
     *
     * @example
     *     response.header("Content-Type", "text/plain");
     */
    header(name: string, value: string): this;
    /** Set multiple headers at once and overwrides existing ones. */
    headers(headers: Record<string, string>): this;
    /**
     * Sets the status code of the response
     *
     * @example
     *     response.status(404); // Not found
     *
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status}
     */
    status(statusCode: StatusCode): this;
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
    cookie(name: string, value: string, options?: Partial<CookieOptions>): this;
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
    streamResponse(streamFunction: (stream: Stream<R, M>) => Promise<void> | void): void;
    /**
     * Sets the response body, will only be sent to the client after it has gone
     * through all the middleware.
     */
    body(body: string): void;
    /** Same as {@link body} but sets the `Content-Type` header to `text/plain` */
    text(body: string): void;
    /**
     * Same as {@link body} but sets the `Content-Type` header to
     * `application/json`
     */
    json(body: unknown): void;
    /** Same as {@link body} but sets the `Content-Type` header to `text/html` */
    html(body: string): void;
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
    redirect(code: RedirectStatusCode, location: string): void;
    /**
     * Sets the status code to `200` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/200}
     */
    ok(): this;
    /**
     * Sets the status code to `201` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/201}
     */
    created(): this;
    /**
     * Sets the status code to `400` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/400}
     */
    badRequest(): this;
    /**
     * Sets the status code to `401` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/401}
     */
    unauthorized(): this;
    /**
     * Sets the status code to `403` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403}
     */
    forbidden(): this;
    /**
     * Sets the status code to `404` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404}
     */
    notFound(): this;
    /**
     * Sets the status code to `422` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/422}
     */
    unprocessableContent(): this;
    /**
     * Sets the status code to `429` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/429}
     */
    tooManyRequests(): this;
    /**
     * Sets the status code to `500` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/500}
     */
    internalServerError(): this;
    /**
     * Sets the status code to `501` @see
     * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/501}
     */
    notImplemented(): this;
}
export {};
