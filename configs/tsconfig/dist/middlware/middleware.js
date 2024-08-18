/**
 * Wrap the middleware function in this function to get typechecking.
 *
 * @example
 *     const myMiddleware = middleware(({ request, response }, next) => {
 *         await next();
 *     });
 */
export function middleware(middlewareFunction) {
    return middlewareFunction;
}
/**
 * Wrap the before function in this function to get typechecking.
 *
 * @example
 *     const myBeforeFunction = beforeFunction(async (request) => {
 *         return {
 *             user: getUser(request),
 *         };
 *     });
 */
export function beforeFunction(beforeFunction) {
    return beforeFunction;
}
