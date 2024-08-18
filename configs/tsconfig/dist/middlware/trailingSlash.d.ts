import { Middleware } from "../builders.js";
import { RedirectStatusCode } from "../response.js";
interface TrailingSlashMiddlewareConfig {
    trailingSlash: boolean;
    statusCode: RedirectStatusCode;
    keepTrailingQuestionmark: boolean;
}
/**
 * Depending on the configuration this middleware can remove or add trailing
 * slashes, hashes and questionmarks on the requested url. If the requested url
 * dosn't match the configuration this middleware will redirect to how the
 * correct url is.
 *
 * @example
 *     router.use(
 *         trailingSlash({
 *             trailingSlash: false, // Boolean, defaults to false. To add trailing slashes or not, true will add and false will remove.
 *             statusCode: statusCodes.MovedPermanently, // RedirectStatusCode, defaults to 308. The status code the redirect is done with.
 *             keepTrailingQuestionmark: false, // Boolean, default to false. Same as keepTrailingHash but for trailing questionmarks.
 *         })
 *     );
 */
export declare function trailingSlash(config?: Partial<TrailingSlashMiddlewareConfig>): Middleware;
export {};
