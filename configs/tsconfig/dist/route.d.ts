import { HandlerFunction, HandlerFunctionArguments, MiddlewareOrBefore, ParserFunctions } from "./builders.js";
import type { Method, Path } from "./router.js";
import { Validators } from "./validate.js";
export declare class Route {
    readonly path: Path;
    readonly method: Method | null;
    parsers: ParserFunctions;
    private readonly handler;
    middleware: MiddlewareOrBefore[];
    constructor(path: Path, method: Method | null, parsers: ParserFunctions, handler: HandlerFunction<Path, Method[] | null, NonNullable<unknown>, NonNullable<unknown>, Validators>, middleware: MiddlewareOrBefore[]);
    handleRequest(params: HandlerFunctionArguments<Path, Method[] | null, NonNullable<unknown>, NonNullable<unknown>, Validators>): Promise<void>;
}
