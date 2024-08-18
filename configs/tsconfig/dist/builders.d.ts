import { Request } from "./request.js";
import { Response } from "./response.js";
import { Route } from "./route.js";
import type { AutocompletePath, CheckPath, FirstSlug, Method, Path, PathError, RestSlugs } from "./router.js";
import { JoinValidators, UnvalidatedFunctions, ValidatedFunctions, ValidatorFunction, Validators, ValidatorType } from "./validate.js";
type ObjectItem<Name extends string> = {
    [K in Name]: string;
};
type OptionalObjectItem<Name extends string> = {
    [K in Name]?: string | undefined;
};
type Mix<T> = {
    [K in keyof T]: T[K];
};
type PathRecursive<T extends Path | never> = T extends never ? {} : T extends "/" ? never : WildcardOptionalPath<T>;
type WildcardOptionalPath<T extends Path> = FirstSlug<T> extends `/*?` ? RestSlugs<T> extends never ? OptionalObjectItem<"wildcard"> : never : WildcardPath<T>;
type WildcardPath<T extends Path> = FirstSlug<T> extends `/*` ? RestSlugs<T> extends never ? ObjectItem<"wildcard"> : never : DynamicOptionalPath<T>;
type DynamicOptionalPath<T extends Path> = FirstSlug<T> extends `/:${infer Name}?` ? Name extends "" ? never : RestSlugs<T> extends never ? OptionalObjectItem<Name> : OptionalObjectItem<Name> & PathRecursiveOptional<RestSlugs<T>> : DynamicPath<T>;
type DynamicPath<T extends Path> = FirstSlug<T> extends `/:${infer Name}` ? Name extends "" ? never : RestSlugs<T> extends never ? ObjectItem<Name> : ObjectItem<Name> & PathRecursive<RestSlugs<T>> : StaticPath<T>;
type StaticPath<T extends Path> = RestSlugs<T> extends never ? {} : PathRecursive<RestSlugs<T>>;
type PathRecursiveOptional<T extends Path | never> = T extends never ? {} : T extends "/" ? never : WildcardOnlyOptionalPath<T>;
type WildcardOnlyOptionalPath<T extends Path> = FirstSlug<T> extends `/*?` ? RestSlugs<T> extends never ? OptionalObjectItem<"wildcard"> : never : DynamicOnlyOptionalPath<T>;
type DynamicOnlyOptionalPath<T extends Path> = FirstSlug<T> extends `/:${infer Name}?` ? Name extends "" ? never : RestSlugs<T> extends never ? OptionalObjectItem<Name> : OptionalObjectItem<Name> & PathRecursiveOptional<RestSlugs<T>> : never;
/** Get the params, and thire value, from a path */
type Params<T extends Path> = T extends "/" ? {} : Mix<PathRecursive<T>>;
type UnparseableFunction = () => never;
/**
 * Parser function with the type of the param, throw Unparseable error if the
 * dynamic route is invalid
 */
export type ParserFunction<T> = (data: {
    param: T;
    unparseable: UnparseableFunction;
}) => unknown;
/** The type for custom parser functions */
export type CustomParserFunction<T, R> = (data: {
    param: T;
    unparseable: UnparseableFunction;
}) => R;
/**
 * The parser functions for a path, should only be used in frontend. Excludes
 * already parsed params
 */
type ParserFunctionsForPath<R extends Path, P extends Parsed<ParserFunctions>> = Partial<{
    [K in keyof ExcludeAlreadyParsed<R, P>]: ParserFunction<DefaultOrParsedParams<R, P>[K]>;
}>;
/** Exclued the already parsed from the route */
type ExcludeAlreadyParsed<R extends Path, P extends Parsed<ParserFunctions>> = Omit<Params<R>, keyof P>;
export type ParserFunctions = Record<string, ParserFunction<NonNullable<unknown>>> | ParserFunctionsForPath<Path, NonNullable<unknown>>;
/** Get the return type for the parser functions */
export type Parsed<T extends ParserFunctions> = {
    [K in keyof T]: T[K] extends (...args: any) => any ? ReturnType<T[K]> : undefined;
};
/** Used for front facing params for a specific route */
type DefaultOrParsedParams<R extends Path, P extends Parsed<ParserFunctions>> = Omit<Params<R>, keyof P> & P;
export type HandlerFunctionArguments<R extends Path, M extends Method[] | null, P extends Parsed<ParserFunctions>, L extends Locals, V extends Validators> = {
    request: Request<R, M, DefaultOrParsedParams<R, P>, L, V>;
    response: Response<R, M>;
};
/** Handles the requests */
export type HandlerFunction<R extends Path, M extends Method[] | null, P extends Parsed<ParserFunctions>, L extends Locals, V extends Validators> = (data: HandlerFunctionArguments<R, M, P, L, V>) => void | Promise<void>;
export type NextFunction = () => Promise<void> | void;
export interface MiddlewareContext {
    request: Request<Path | null, Method[] | null, Record<string, unknown>, Record<string, unknown>, Validators>;
    response: Response<Path, Method[] | null>;
}
export type MiddlewareOrBefore = {
    type: "Middleware";
    middleware: Middleware;
} | {
    type: "Before";
    before: BeforeFunction<Path, Parsed<ParserFunctions>>;
} | {
    type: "Validator";
    validator: ValidatorFunction<unknown>;
    validatorType: ValidatorType;
};
export type Middleware = (context: MiddlewareContext, next: NextFunction) => Promise<void> | void;
export type Locals = Record<string, unknown>;
export type BeforeFunction<R extends Path, P extends Parsed<ParserFunctions>, Re extends Locals = Record<string, unknown>> = (request: Request<Path | null, [
    Method
], DefaultOrParsedParams<R, P>, Record<string, unknown>, Validators>) => Re extends never ? Promise<Locals> | Locals | Promise<void> | void : Promise<Re> | Re;
export type JoinLocals<R extends Path, T extends BeforeFunction<R, P>, U extends Locals, P extends Parsed<ParserFunctions>> = Omit<U, keyof Awaited<ReturnType<T>>> & Awaited<ReturnType<T>>;
/** Join two paths together */
type JoinPaths<A extends Path, B extends Path> = A extends "/" ? B : B extends "/" ? A : A extends `/${infer Slug}` ? `/${Slug}${B}` : never;
export interface BuildableToRoutes {
    build(): Route[];
}
interface RouteBuilderParsedAllMethods<R extends Path, P extends Parsed<ParserFunctions>, L extends Locals, V extends Validators> {
    handle(handler: HandlerFunction<R, null, P, L, V>): void;
    use(middleware: Middleware): this;
    before<T extends BeforeFunction<R, P>>(beforeFunction: T): RouteBuilderParsedAllMethods<R, P, JoinLocals<R, T, L, P>, V>;
    validate<T extends UnvalidatedFunctions<V>>(validators: T): RouteBuilderParsedAllMethods<R, P, L, JoinValidators<ValidatedFunctions<T>, V>>;
}
export interface RouteBuilderUnparsedAllMethods<R extends Path, P extends Parsed<ParserFunctions>, L extends Locals, V extends Validators> extends RouteBuilderParsedAllMethods<R, P, L, V> {
    use(middleware: Middleware): this;
    before<T extends BeforeFunction<R, P>>(beforeFunction: T): RouteBuilderUnparsedAllMethods<R, P, JoinLocals<R, T, L, P>, V>;
    validate<T extends UnvalidatedFunctions<V>>(validators: T): RouteBuilderUnparsedAllMethods<R, P, L, JoinValidators<ValidatedFunctions<T>, V>>;
    parse<T extends ParserFunctionsForPath<R, P>>(parsers: T): RouteBuilderParsedAllMethods<R, P & Parsed<T>, L, V>;
}
interface RouteBuilderParsed<R extends Path, M extends Method[], P extends Parsed<ParserFunctions>, L extends Locals, V extends Validators> {
    /**
     * Takes a callback function that runs on requests to this route. It runs
     * inbetween all middleware, and after all before functions. All route
     * builders has to have a handler.
     *
     * @example
     *     router
     *         .get("/user/:id")
     *         .parse({ id: intParser })
     *         .handle(async ({ request, response }) => {
     *             return response.ok().json(await getUser(request.params.id));
     *         });
     *
     * @see {@link Request}
     * @see {@link Response}
     */
    handle(handler: HandlerFunction<R, M, P, L, V>): void;
    use(middleware: Middleware): this;
    before<T extends BeforeFunction<R, P>>(beforeFunction: T): RouteBuilderParsed<R, M, P, JoinLocals<R, T, L, P>, V>;
    validate<T extends UnvalidatedFunctions<V>>(validators: T): RouteBuilderParsed<R, M, P, L, JoinValidators<ValidatedFunctions<T>, V>>;
}
export interface RouteBuilderUnparsed<R extends Path, M extends Method[], P extends Parsed<ParserFunctions>, L extends Locals, V extends Validators> extends RouteBuilderParsed<R, M, P, L, V> {
    use(middleware: Middleware): this;
    before<T extends BeforeFunction<R, P>>(beforeFunction: T): RouteBuilderUnparsed<R, M, P, JoinLocals<R, T, L, P>, V>;
    validate<T extends UnvalidatedFunctions<V>>(validators: T): RouteBuilderUnparsed<R, M, P, L, JoinValidators<ValidatedFunctions<T>, V>>;
    on<T extends Method>(method: T): RouteBuilderUnparsed<R, [...M, T], P, L, V>;
    get(): RouteBuilderUnparsed<R, [...M, "GET"], P, L, V>;
    post(): RouteBuilderUnparsed<R, [...M, "POST"], P, L, V>;
    put(): RouteBuilderUnparsed<R, [...M, "PUT"], P, L, V>;
    delete(): RouteBuilderUnparsed<R, [...M, "DELETE"], P, L, V>;
    parse<T extends ParserFunctionsForPath<R, P>>(parsers: T): RouteBuilderParsed<R, M, P & Parsed<T>, L, V>;
}
interface RouteGroupBuilderParsed<R extends Path, P extends Parsed<ParserFunctions>, L extends Locals, V extends Validators> {
    /** @see {@link RouteBuilderParsed.handle} */
    handle(): RouteGroup<R, P, L, V>;
    use(middleware: Middleware): this;
    before<T extends BeforeFunction<R, P>>(beforeFunction: T): RouteGroupBuilderParsed<R, P, JoinLocals<R, T, L, P>, V>;
    validate<T extends UnvalidatedFunctions<V>>(validators: T): RouteGroupBuilderParsed<R, P, L, JoinValidators<ValidatedFunctions<T>, V>>;
}
export interface RouteGroupBuilderUnparsed<R extends Path, P extends Parsed<ParserFunctions>, L extends Locals, V extends Validators> extends RouteGroupBuilderParsed<R, P, L, V> {
    use(middleware: Middleware): this;
    before<T extends BeforeFunction<R, P>>(beforeFunction: T): RouteGroupBuilderUnparsed<R, P, JoinLocals<R, T, L, P>, V>;
    validate<T extends UnvalidatedFunctions<V>>(validators: T): RouteGroupBuilderUnparsed<R, P, L, JoinValidators<ValidatedFunctions<T>, V>>;
    parse<T extends ParserFunctionsForPath<R, P>>(parsers: T): RouteGroupBuilderParsed<R, P & Parsed<T>, L, V>;
}
interface RouteGroup<R extends Path, P extends Parsed<ParserFunctions>, L extends Locals, V extends Validators> {
    on<T extends Method, U extends Path>(method: T, path: CheckPath<U> extends PathError ? CheckPath<U> | NoInfer<AutocompletePath<U>> : NoInfer<U | AutocompletePath<U>>): RouteBuilderUnparsed<JoinPaths<R, U>, [T], P, L, V>;
    get<T extends Path>(path: CheckPath<T> extends PathError ? CheckPath<T> | NoInfer<AutocompletePath<T>> : NoInfer<T | AutocompletePath<T>>): RouteBuilderUnparsed<JoinPaths<R, T>, ["GET"], P, L, V>;
    post<T extends Path>(path: CheckPath<T> extends PathError ? CheckPath<T> | NoInfer<AutocompletePath<T>> : NoInfer<T | AutocompletePath<T>>): RouteBuilderUnparsed<JoinPaths<R, T>, ["POST"], P, L, V>;
    put<T extends Path>(path: CheckPath<T> extends PathError ? CheckPath<T> | NoInfer<AutocompletePath<T>> : NoInfer<T | AutocompletePath<T>>): RouteBuilderUnparsed<JoinPaths<R, T>, ["PUT"], P, L, V>;
    delete<T extends Path>(path: CheckPath<T> extends PathError ? CheckPath<T> | NoInfer<AutocompletePath<T>> : NoInfer<T | AutocompletePath<T>>): RouteBuilderUnparsed<JoinPaths<R, T>, ["DELETE"], P, L, V>;
    all<T extends Path>(path: CheckPath<T> extends PathError ? CheckPath<T> | NoInfer<AutocompletePath<T>> : NoInfer<T | AutocompletePath<T>>): RouteBuilderUnparsedAllMethods<JoinPaths<R, T>, P, L, V>;
    group<T extends Path>(path: CheckPath<T> extends PathError ? (PathError & CheckPath<T>) | NoInfer<AutocompletePath<T>> : NoInfer<T | AutocompletePath<T>>): RouteGroupBuilderUnparsed<JoinPaths<R, T>, P, L, V>;
}
export declare class RouteBuilder<R extends Path, M extends Method[], P extends Parsed<ParserFunctions>, L extends Locals, V extends Validators> implements RouteBuilderUnparsed<R, M, P, L, V> {
    readonly path: R;
    readonly methods: M;
    parsers: ParserFunctions | undefined;
    handler: HandlerFunction<R, M, P, L, V> | undefined;
    middleware: MiddlewareOrBefore[];
    constructor(path: R, methods: M);
    parse<T extends ParserFunctionsForPath<R, P>>(parsers: T): RouteBuilderParsed<R, M, P & Parsed<T>, L, V>;
    use(middleware: Middleware): this;
    before<T extends BeforeFunction<R, P>>(beforeFunction: T): RouteBuilderUnparsed<R, M, P, JoinLocals<R, T, L, P>, V>;
    validate<T extends UnvalidatedFunctions<V>>(validators: T): RouteBuilderUnparsed<R, M, P, L, JoinValidators<ValidatedFunctions<T>, V>>;
    on<T extends Method>(method: T): RouteBuilderUnparsed<R, [...M, T], P, L, V>;
    get(): RouteBuilderUnparsed<R, [...M, "GET"], P, L, V>;
    post(): RouteBuilderUnparsed<R, [...M, "POST"], P, L, V>;
    put(): RouteBuilderUnparsed<R, [...M, "PUT"], P, L, V>;
    delete(): RouteBuilderUnparsed<R, [...M, "DELETE"], P, L, V>;
    handle(handler: HandlerFunction<R, M, P, L, V>): void;
    build(): Route[];
}
export declare class RouteBuilderAllMethods<R extends Path, P extends Parsed<ParserFunctions>, L extends Locals, V extends Validators> implements RouteBuilderUnparsedAllMethods<R, P, L, V>, BuildableToRoutes {
    readonly path: R;
    parsers: ParserFunctions | undefined;
    handler: HandlerFunction<R, null, P, L, V> | undefined;
    middleware: MiddlewareOrBefore[];
    constructor(path: R);
    parse<T extends ParserFunctionsForPath<R, P>>(parsers: T): RouteBuilderParsedAllMethods<R, P & Parsed<T>, L, V>;
    use(middleware: Middleware): this;
    before<T extends BeforeFunction<R, P>>(beforeFunction: T): RouteBuilderUnparsedAllMethods<R, P, JoinLocals<R, T, L, P>, V>;
    validate<T extends UnvalidatedFunctions<V>>(validators: T): RouteBuilderUnparsedAllMethods<R, P, L, JoinValidators<ValidatedFunctions<T>, V>>;
    handle(handler: HandlerFunction<R, null, P, L, V>): void;
    build(): Route[];
}
export declare class RouteGroupBuilder<R extends Path, P extends Parsed<ParserFunctions>, L extends Locals, V extends Validators> implements RouteGroupBuilderUnparsed<R, P, L, V>, BuildableToRoutes {
    readonly path: R;
    parsers: ParserFunctions | undefined;
    routeGroup: RouteGroupBackend<R, P, L, V> | undefined;
    middleware: MiddlewareOrBefore[];
    constructor(path: R);
    parse<T extends ParserFunctionsForPath<R, P>>(parsers: T): RouteGroupBuilderParsed<R, P & Parsed<T>, L, V>;
    use(middleware: Middleware): this;
    before<T extends BeforeFunction<R, P>>(beforeFunction: T): RouteGroupBuilderUnparsed<R, P, JoinLocals<R, T, L, P>, V>;
    validate<T extends UnvalidatedFunctions<V>>(validators: T): RouteGroupBuilderUnparsed<R, P, L, JoinValidators<ValidatedFunctions<T>, V>>;
    handle(): RouteGroup<R, P, L, V>;
    build(): Route[];
}
declare class RouteGroupBackend<R extends Path, P extends Parsed<ParserFunctions>, L extends Locals, V extends Validators> implements RouteGroup<R, P, L, V>, BuildableToRoutes {
    readonly path: R;
    routeBuilders: BuildableToRoutes[];
    groupBuilders: BuildableToRoutes[];
    constructor(path: R);
    private joinPaths;
    on<T extends Method, U extends Path>(method: T, path: CheckPath<U> extends PathError ? (PathError & CheckPath<U>) | NoInfer<AutocompletePath<U>> : NoInfer<U | AutocompletePath<U>>): RouteBuilderUnparsed<JoinPaths<R, U>, [T], P, L, V>;
    get<T extends Path>(path: CheckPath<T> extends PathError ? (PathError & CheckPath<T>) | NoInfer<AutocompletePath<T>> : NoInfer<T | AutocompletePath<T>>): RouteBuilderUnparsed<JoinPaths<R, T>, ["GET"], P, L, V>;
    post<T extends Path>(path: CheckPath<T> extends PathError ? (PathError & CheckPath<T>) | NoInfer<AutocompletePath<T>> : NoInfer<T | AutocompletePath<T>>): RouteBuilderUnparsed<JoinPaths<R, T>, ["POST"], P, L, V>;
    put<T extends Path>(path: CheckPath<T> extends PathError ? (PathError & CheckPath<T>) | NoInfer<AutocompletePath<T>> : NoInfer<T | AutocompletePath<T>>): RouteBuilderUnparsed<JoinPaths<R, T>, ["PUT"], P, L, V>;
    delete<T extends Path>(path: CheckPath<T> extends PathError ? (PathError & CheckPath<T>) | NoInfer<AutocompletePath<T>> : NoInfer<T | AutocompletePath<T>>): RouteBuilderUnparsed<JoinPaths<R, T>, ["DELETE"], P, L, V>;
    all<T extends Path>(path: CheckPath<T> extends PathError ? (PathError & CheckPath<T>) | NoInfer<AutocompletePath<T>> : NoInfer<T | AutocompletePath<T>>): RouteBuilderUnparsedAllMethods<JoinPaths<R, T>, P, L, V>;
    group<T extends Path>(path: CheckPath<T> extends PathError ? (PathError & CheckPath<T>) | NoInfer<AutocompletePath<T>> : NoInfer<T | AutocompletePath<T>>): RouteGroupBuilderUnparsed<JoinPaths<R, T>, P, L, V>;
    build(): Route[];
}
export {};
