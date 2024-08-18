import http from "http";
import type { Server } from "./server.js";
import type { Method, Path } from "./router.js";
import type { Locals, Parsed, ParserFunction, ParserFunctions } from "./builders.js";
import { Validators } from "./validate.js";
import formidable from "formidable";
type ParsedMultipart<T> = Readonly<{
    [key: string]: T | T[] | ParsedMultipart<T>;
}>;
/** Handles query params for requests. */
declare class QueryParams<V extends Validators["query"]> {
    private readonly queryParams;
    /**
     * Same as {@link QueryParams.get} exept it only contains validated query
     * params.
     */
    validated: V;
    constructor(queryParams: URLSearchParams, validatedQueryParams: V);
    get<T extends string>(name: T): V extends NonNullable<unknown> ? T extends keyof V ? V[T] : string | undefined : string | undefined;
    getAndParse<T extends ParserFunction<string | undefined>>(name: string, parser: T): ReturnType<T>;
    /**
     * Returns a `Map` of all the query params. It does not care about validated
     * params and only returns the original ones sent with the request.
     */
    all(): Readonly<Map<string, string>>;
    /**
     * Converts and returns all query parameters as a plain old JavaScript
     * object.
     *
     * @example
     *     "name=John&pet=cat" => { name: "John", pet: "cat" }
     *     "user.name=John&user.pet=cat" => {user: { name: "John", pet: "cat" }}
     *     "pets=cat&pets=dog" => { pets: ["cat", "dog"] }
     */
    toObject(): unknown;
}
/** Class storing cookies on requests, can only be read. */
declare class Cookies {
    private cookies;
    constructor(cookieHeader: string);
    /**
     * Parses the cookie header and mutates this class, therefor it dosn't
     * return anything.
     */
    parseCookieHeader(cookieHeader: string): void;
    /**
     * Gets one cookie from the incomming request, if it dosnt exist the
     * function will return `undefined`.
     */
    get(name: string): string | undefined;
    /** Gets all the cookies as a map from the incomming request. */
    all(): Readonly<Map<string, string>>;
    /** The number of cookies with the incomming request. */
    size(): number;
}
/** The request object for incomming requests. */
export declare class Request<R extends Path | null, M extends Method[] | null, P extends Parsed<ParserFunctions>, L extends Locals, V extends Validators> {
    private readonly server;
    private readonly request;
    /**
     * The url params with thire types after the parsers.
     *
     * @example
     *     router
     *         .get("/users/:id/*?")
     *         .parse({ id: intParser })
     *         .handle(({ request, response }) => {
     *             request.params; // { id: number, wildcard: string | undefined }
     *         });
     */
    readonly params: P;
    /**
     * The url of the request. Don't use this to get query params, instead use
     * the `query` property of this request.
     */
    readonly url: URL;
    /**
     * The path requested by the client, unlike the {@link url} parameter this
     * one is the completely unparsed path requested by the client.
     */
    requestedPath: string;
    /**
     * The path specified for this route in the router.
     *
     * @example
     *     router.get("/users/:id").handle(({ request, response }) => {
     *         request.routerPath; // "/users/:id"
     *     });
     */
    routerPath: R;
    /** The http method used to make the request. It can be non standard. */
    readonly method: M extends Method[] ? M[number] : Method;
    /** The headers sent with the request */
    readonly headers: Record<string, string>;
    /**
     * The url query params from the request
     *
     * @example
     *     request.query.get("id"); // Get one query param
     *     request.query.all(); // Get all query params
     *
     * @see {@link QueryParams}
     */
    readonly query: QueryParams<V["query"]>;
    /** The locals passed from previous before functions */
    locals: L;
    /**
     * Readonly cookies from the incomming request. To send cookies with the
     * response use the `response` object.
     *
     * @example
     *     request.cookies.get("session"); // string | undefined
     *     request.cookies.all(); // Map<string, string>
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
     */
    readonly cookies: Cookies;
    /** The value of the `Content-Type` header on the request */
    readonly contentType: string | undefined;
    private bodyString;
    private multipartFiles;
    private isMultipartRequest;
    private multipartForm;
    private handledMultipartRequest;
    /** Use {@link Request.json} instead! */
    validatedJsonBody: (V["body"] extends NonNullable<unknown> ? V["body"] : unknown) | undefined;
    constructor(server: Server, request: http.IncomingMessage, params: P, locals: L, routerPath: R);
    private urlFromRequestUrl;
    /**
     * Await the request body and returns it as a string. This method can be
     * used multiple times. To parse the request body as `json` use the
     * {@link json} method on the request.
     *
     * @example
     *     await request.body(); // Text body
     *     await request.json(); // Parsed json body
     */
    body(): Promise<string>;
    /** Same as the {@link body} method. */
    text(): Promise<string>;
    /**
     * Gets the request body and parses it with `JSON.parse`. If the
     * `Content-Type` header on the request is
     * `application/x-www-form-urlencoded` then this function also converts it
     * into json. If multiple input elements in the form data have the same name
     * then a array will be created for those values. Files sent with the
     * request when the `Content-Type` header on the request is set to
     * `application/x-www-form-urlencoded` will also be returned from here. If
     * you only want the files you can use the {@link Request.files} or
     * {@link Request.filesFlat} method.
     */
    json(): Promise<V["body"] extends NonNullable<unknown> ? V["body"] : unknown>;
    private handleMultipartRequest;
    /**
     * Returns all the files sent with the request. The `Content-Type` header of
     * the request has to be set to `multipart/form-data` for it to return any
     * files. The files are categorized the same way as how url encoded data
     * would be parsed in the {@link Request.json} function. The files with the
     * request will also be returned from the {@link Request.json} function.
     *
     * @example
     *     const files = await request.files();
     */
    files(): Promise<ParsedMultipart<formidable.File>>;
    /**
     * Returns the files sent with the request but not parsed like how the
     * {@link Request.files} function would do it.
     */
    filesFlat(): Promise<Readonly<Record<string, formidable.File[]>>>;
}
export {};
