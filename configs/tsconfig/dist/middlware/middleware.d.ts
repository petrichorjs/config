import { BeforeFunction, Locals, Middleware } from "../builders.js";
import { Path } from "../router.js";
/**
 * Wrap the middleware function in this function to get typechecking.
 *
 * @example
 *     const myMiddleware = middleware(({ request, response }, next) => {
 *         await next();
 *     });
 */
export declare function middleware<T extends Middleware>(middlewareFunction: T): T;
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
export declare function beforeFunction<P extends Record<string, unknown>, R extends Locals, T extends BeforeFunction<Path, P, R> = BeforeFunction<Path, P, R>>(beforeFunction: T): T;
