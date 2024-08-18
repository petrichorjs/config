import { JsonValue, StatusCode } from "./response.js";
/** An error object that gets converted into a http response on requests */
export declare class HttpError extends Error {
    readonly status: StatusCode;
    readonly message: string;
    constructor(status: StatusCode, message: string);
    toResponseJson(): JsonValue;
}
/** Throws an {@link UnparseableError} error. Only ment for internal use. */
export declare function throwUnparseableError(name: string): never;
/**
 * Thrown to indicate that the parser could not parse the data. In the case for
 * dynamic routes, that route will just be skipped and if no other route was
 * found the client will get a `404` response
 *
 * Preferable use the {@link throwUnparseableError} method to throw this error.
 */
export declare class UnparseableError extends HttpError {
    constructor(name: string);
}
