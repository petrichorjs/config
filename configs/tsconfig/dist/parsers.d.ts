import { CustomParserFunction } from "./builders.js";
/**
 * Parse a param and ensure it's a number, uses the parseInt function under the
 * hood.
 *
 * @example
 *     router
 *         .get("/users/:id")
 *         .parse({
 *             id: intParser,
 *         })
 *         .handle(({ request }) => {
 *             request.params.id; // Will be of type number
 *         });
 *
 * @example
 *     ({ request }) => {
 *         const id = request.query.getAndParse("id", intParser);
 *         // Id will be of type number
 *     };
 */
export declare const intParser: CustomParserFunction<string | undefined, number>;
