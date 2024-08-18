/** An error object that gets converted into a http response on requests */
export class HttpError extends Error {
    status;
    message;
    constructor(status, message) {
        super(`Http Error: ${status} - ${message}`);
        this.status = status;
        this.message = message;
    }
    toResponseJson() {
        return {
            message: this.message,
        };
    }
}
/** Throws an {@link UnparseableError} error. Only ment for internal use. */
export function throwUnparseableError(name) {
    throw new UnparseableError(name);
}
/**
 * Thrown to indicate that the parser could not parse the data. In the case for
 * dynamic routes, that route will just be skipped and if no other route was
 * found the client will get a `404` response
 *
 * Preferable use the {@link throwUnparseableError} method to throw this error.
 */
export class UnparseableError extends HttpError {
    constructor(name) {
        super(422, `Unparseable route param or query param: '${name}'!`);
    }
}
