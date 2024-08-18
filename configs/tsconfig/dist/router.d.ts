import { BeforeFunction, JoinLocals, Locals, Middleware, RouteBuilderUnparsed, RouteBuilderUnparsedAllMethods, RouteGroupBuilderUnparsed } from "./builders.js";
import { Route } from "./route.js";
/**
 * Path for routes, must start with a slash.
 *
 * @example
 *     ```ts
 *     const path: Path = "/users/:id" // Ok
 *     const path: Path = "users/:id" // Not ok
 *     ```;
 */
export type Path = `/${string}`;
type PathErrors = {
    TrailingSlash: "CANNOT END PATH WITH TRAILING SLASH";
    FollowedWildcard: "WILDCARDS CANNOT BE FOLLOWED BY ROUTES";
    EmptyDynamicName: "EMPTY DYNAMIC PATH NAME";
    OptionalFollowOptional: "OPTIONAL DYNAMIC ROUTES CAN ONLY BE FOLLOWED BY OTHER OPTIONAL ROUTES";
    StartWithSlash: "ROUTES MUST START WITH A SLASH";
};
export type PathError = PathErrors[keyof PathErrors];
export type Slash<T extends string> = `/${T}`;
export type FirstSlug<T extends Path> = T extends `/${infer Slug}/${string}` ? Slash<Slug> : T extends `/${infer Slug}` ? Slash<Slug> : T;
export type RestSlugs<T extends Path> = T extends `/${string}/${infer Rest}` ? Slash<Rest> : never;
export type LastSlug<T extends Path> = RestSlugs<T> extends never ? T : LastSlug<RestSlugs<T>>;
type ContainsOptional<T extends Path> = T extends `/${string}?${string}` ? true : false;
type PathRecursive<T extends Path> = T extends "/" ? PathErrors["TrailingSlash"] : WildcardOptionalPath<T>;
type WildcardOptionalPath<T extends Path> = FirstSlug<T> extends `/*?` ? RestSlugs<T> extends never ? T : PathErrors["FollowedWildcard"] : WildcardPath<T>;
type WildcardPath<T extends Path> = FirstSlug<T> extends `/*` ? RestSlugs<T> extends never ? T : PathErrors["FollowedWildcard"] : DynamicOptionalPath<T>;
type DynamicOptionalPath<T extends Path> = FirstSlug<T> extends `/:${infer Name}?` ? Name extends "" ? PathErrors["EmptyDynamicName"] : RestSlugs<T> extends never ? T : PathRecursiveOptional<RestSlugs<T>> : DynamicPath<T>;
type DynamicPath<T extends Path> = FirstSlug<T> extends `/:${infer Name}` ? Name extends "" ? PathErrors["EmptyDynamicName"] : RestSlugs<T> extends never ? T : PathRecursive<RestSlugs<T>> : StaticPath<T>;
type StaticPath<T extends Path> = RestSlugs<T> extends never ? T : PathRecursive<RestSlugs<T>>;
type PathRecursiveOptional<T extends Path> = T extends "/" ? PathErrors["TrailingSlash"] : WildcardOnlyOptionalPath<T>;
type WildcardOnlyOptionalPath<T extends Path> = FirstSlug<T> extends `/*?` ? RestSlugs<T> extends never ? T : PathErrors["FollowedWildcard"] : DynamicOnlyOptionalPath<T>;
type DynamicOnlyOptionalPath<T extends Path> = FirstSlug<T> extends `/:${infer Name}?` ? Name extends "" ? PathErrors["EmptyDynamicName"] : RestSlugs<T> extends never ? T : PathRecursiveOptional<RestSlugs<T>> : PathErrors["OptionalFollowOptional"];
export type CheckPath<T extends Path> = T extends "/" ? T : PathRecursive<T>;
export type AutocompletePath<T extends Path> = `${T}${(LastSlug<T> extends `/:${infer Name}` ? (Name extends `${string}?` ? never : "?/:" | "?/*?" | "?") : never) | (ContainsOptional<T> extends true ? never : "/" | "/*" | "/*?")}`;
/**
 * Http methods. All strings are allowed to support custom methods, but non
 * standard ones don't have shorthand methods.
 */
export type Method = "GET" | "POST" | "PUT" | "DELETE" | string;
export type Body = unknown;
export declare class RouteGroup {
    /** The path so far to this group */
    private readonly path;
    private readonly staticChildGroups;
    private readonly staticChildGroupsMethodWildcard;
    private readonly dynamicChildGroups;
    private readonly dynamicChildGroupsMethodWildcard;
    private readonly wildcardChildRoutes;
    private readonly wildcardChildRoutesMethodWildcard;
    private readonly routes;
    private routeMethodWildcard;
    constructor(path: Path);
    private getFirstSlugOfPath;
    private addRoute;
    makeRouteGroupsForPath(path: Path, route: Route): void;
    private parseOrCatchUnparseable;
    getRouteFromPath(path: Path, method: Method): {
        route: Route;
        params: Record<string, unknown>;
    } | undefined;
    private getRouteFromStaticChildGroup;
    private getRouteFromDynamicChildGroup;
    private getRouteFromWildcardChildGroup;
}
/**
 * Handles the incomming requests and finds a route that matches
 *
 * The order of what route gets selected is as follows:
 *
 * 1. Static routes: `/users/me` or `/`
 * 2. Dynamic routes: `/users/:id`
 * 3. Optional dynamic routes: `/users/:id?`
 * 4. Wildcard routes: `/users/*`
 * 5. Optional wildcard routes: `/users/*?`
 *
 * The method order:
 *
 * 1. Explicit methods: `router.get`, `router.post` or `router.on`
 * 2. Wildcard methods: `router.all`
 *
 * Note that the parsers also have to match for the dynamic routes.
 *
 * Creating routes can be done by either using the `on` or using one of the
 * shorthand methods method:
 *
 * ```ts
 * router.on("GET", "/users/:id").handle(({ request, response }) => {});
 * router.get("/users/:id").handle(({ request, response }) => {});
 * ```
 */
export declare class Router<L extends Locals = NonNullable<unknown>> {
    private readonly routeBuilders;
    private readonly groupBuilders;
    private middleware;
    constructor();
    /** Handle `get` requests. Shorthand for the `router.on("GET", ...)` method. */
    get<R extends Path>(route: CheckPath<R> extends PathError ? CheckPath<R> | NoInfer<AutocompletePath<R>> : NoInfer<R | AutocompletePath<R>>): RouteBuilderUnparsed<R, [
        "GET"
    ], NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>>;
    /**
     * Handle `post` requests. Shorthand for the `router.on("POST", ...)`
     * method.
     */
    post<R extends Path>(route: CheckPath<R> extends PathError ? CheckPath<R> | NoInfer<AutocompletePath<R>> : NoInfer<R | AutocompletePath<R>>): RouteBuilderUnparsed<R, [
        "POST"
    ], NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>>;
    /** Handle `put` requests. Shorthand for the `router.on("PUT", ...)` method. */
    put<R extends Path>(route: CheckPath<R> extends PathError ? CheckPath<R> | NoInfer<AutocompletePath<R>> : NoInfer<R | AutocompletePath<R>>): RouteBuilderUnparsed<R, [
        "PUT"
    ], NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>>;
    /**
     * Handle `delete` requests. Shorthand for the `router.on("GET", ...)`
     * method.
     */
    delete<R extends Path>(route: CheckPath<R> extends PathError ? CheckPath<R> | NoInfer<AutocompletePath<R>> : NoInfer<R | AutocompletePath<R>>): RouteBuilderUnparsed<R, [
        "DELETE"
    ], NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>>;
    /**
     * Creates a route builder for the specified method. For all regular methods
     * you can also use shorthand methods: `get`, `post`, `put` and `delete`
     *
     * @example
     *     // Creates a get handler for the `/users/:id` route
     *     // Is also the same as doing router.get("/users/:id")
     *     router.on("GET", "/users/:id").handle(({request, response}) => {
     *     ...
     *     })
     */
    on<M extends Method, R extends Path>(method: M, route: CheckPath<R> extends PathError ? CheckPath<R> | NoInfer<AutocompletePath<R>> : NoInfer<R | AutocompletePath<R>>): RouteBuilderUnparsed<R, [
        M
    ], NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>>;
    /**
     * Simmilar to the on method, but catches all methods. It will only be ran
     * if no other routes with matching methods was found. Therefor it can be
     * used to create custom `404` routes.
     *
     * @example
     *     router.all("/*?").handle(({ request, response }) => {
     *         console.log(request.params.wildcard);
     *     });
     */
    all<R extends Path>(route: CheckPath<R> extends PathError ? CheckPath<R> | NoInfer<AutocompletePath<R>> : NoInfer<R | AutocompletePath<R>>): RouteBuilderUnparsedAllMethods<R, NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>>;
    /**
     * Middleware is a function that gets called before the request gets handled
     * by the handler, it has access to the request, response and calling the
     * next handler method. The middleware to be created first will execute
     * first on incomming requests. For the next middleware and eventually the
     * route handler to be executed the `next` function has to be called. The
     * `next` function dosn't return anything but it might mutate the `response`
     * object depending on what the next middleware or the request handler
     * does.
     *
     * @example
     *     router.use(async ({ request, response }, next) => {
     *         console.log("Started middleware");
     *         await next();
     *         console.log("Ended middleware");
     *     });
     */
    use(middleware: Middleware): this;
    /**
     * A middleware that only has access to the request and runs before the
     * route is handled. It can change request `locals` by returning a object of
     * the `locals`. It can also end requests early by throwing a HttpError
     * which will later populate the response. **Always assign the router
     * valiable after using this or the type checking won't work as expected!**
     *
     * @example
     *     const router = new Router().before(async (request) => {
     *         const user = await getUser(request);
     *         if (!user) throw new HttpError(401, "Unauthorized");
     *
     *         return {
     *             user: user,
     *         };
     *     });
     *     router.get("/").handle(({ request, response }) => {
     *         console.log(request.locals); // { user: User }
     *     });
     */
    before<T extends BeforeFunction<"/", NonNullable<unknown>, NonNullable<unknown>>>(beforeFunction: T): Router<JoinLocals<"/", T, L, NonNullable<unknown>>>;
    /**
     * Create a group of routes. The path can include dynamic paths and they can
     * be parsed using the `parse` function before calling `handle`
     *
     * @example
     *     const userGroup = router.group("/users/:id").handle()
     *     userGroup.get("/").handle(...) // Will handle get requests to /users/:id
     *
     * @example
     *     // Parse the id with the intParser
     *     const userGroup = router
     *         .group("/users/:id")
     *         .parse({
     *             id: intParser,
     *         })
     *         .handle();
     */
    group<R extends Path>(path: CheckPath<R> extends PathError ? (PathError & CheckPath<R>) | NoInfer<AutocompletePath<R>> : NoInfer<R | AutocompletePath<R>>): RouteGroupBuilderUnparsed<R, NonNullable<unknown>, NonNullable<unknown>, NonNullable<unknown>>;
    private buildRouteBuilders;
    /**
     * Listen for requests on the specified port. This method should be called
     * after all routes have been registerd because this method never returns.
     *
     * @example
     *     const router = new Router();
     *     router.get("/").handle(({ request, response }) => {
     *         response.html("<h1>Hello World!</h1>");
     *     });
     *     router.listen(8000);
     *     // GET http://localhost:8000 => Hello World!
     */
    listen(port: number): void;
}
export {};
