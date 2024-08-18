import { RouteBuilder, RouteBuilderAllMethods, RouteGroupBuilder, } from "./builders.js";
import { throwUnparseableError, UnparseableError } from "./error.js";
import { Server } from "./server.js";
function joinPaths(a, b) {
    return ((a === "/" ? "" : a) + (b === "/" ? "" : b) || "/");
}
export class RouteGroup {
    /** The path so far to this group */
    path;
    staticChildGroups;
    staticChildGroupsMethodWildcard;
    dynamicChildGroups;
    dynamicChildGroupsMethodWildcard;
    wildcardChildRoutes;
    wildcardChildRoutesMethodWildcard;
    routes;
    routeMethodWildcard;
    constructor(path) {
        this.path = path;
        this.staticChildGroups = new Map();
        this.staticChildGroupsMethodWildcard = new Map();
        this.dynamicChildGroups = new Map();
        this.dynamicChildGroupsMethodWildcard = {
            required: [],
            optional: [],
        };
        this.wildcardChildRoutes = new Map();
        this.wildcardChildRoutesMethodWildcard = {
            required: undefined,
            optional: undefined,
        };
        this.routes = new Map();
        this.routeMethodWildcard = undefined;
    }
    getFirstSlugOfPath(path) {
        let i = 1;
        while (i < path.length && path[i] !== "/")
            i++;
        return path.slice(1, i);
    }
    addRoute(route) {
        if (route.method === null) {
            if (this.routeMethodWildcard)
                throw "Only one method wildcard route per path!";
            this.routeMethodWildcard = route;
            return;
        }
        const existingMethod = this.routes.get(route.method);
        if (existingMethod)
            throw `Only one route per path and method can be created! Path: '${existingMethod.path}'`;
        this.routes.set(route.method, route);
    }
    makeRouteGroupsForPath(path, route) {
        const slug = this.getFirstSlugOfPath(path);
        if (slug === "") {
            this.addRoute(route);
        }
        else if (slug.startsWith(":")) {
            const isOptional = slug.endsWith("?");
            const dynamicSlugVariableName = slug.slice(1, isOptional ? -1 : undefined);
            let existingMethod = route.method && this.dynamicChildGroups.get(route.method);
            if (route.method !== null && existingMethod === undefined) {
                existingMethod = {
                    required: [],
                    optional: [],
                };
                this.dynamicChildGroups.set(route.method, existingMethod);
            }
            const dynamicChildRouteGroup = new RouteGroup(joinPaths(this.path, `/${slug}`));
            dynamicChildRouteGroup.makeRouteGroupsForPath(`/${path.slice(slug.length + 2)}`, route);
            const parsers = route.parsers;
            const dynamicRoute = {
                dynamicSlugVariableName: dynamicSlugVariableName,
                parser: parsers[dynamicSlugVariableName],
                routeGroup: dynamicChildRouteGroup,
            };
            if (!existingMethod) {
                if (isOptional) {
                    this.dynamicChildGroupsMethodWildcard.optional.push(dynamicRoute);
                }
                else {
                    this.dynamicChildGroupsMethodWildcard.required.push(dynamicRoute);
                }
            }
            else {
                if (isOptional) {
                    existingMethod.optional.push(dynamicRoute);
                }
                else {
                    existingMethod.required.push(dynamicRoute);
                }
            }
        }
        else if (slug === "*" || slug === "*?") {
            const isOptional = slug.endsWith("?");
            let existingMethod = route.method && this.wildcardChildRoutes.get(route.method);
            if (route.method !== null && existingMethod === undefined) {
                existingMethod = {
                    required: undefined,
                    optional: undefined,
                };
                this.wildcardChildRoutes.set(route.method, existingMethod);
            }
            const parsers = route.parsers;
            const parser = parsers["wildcard"];
            if (existingMethod) {
                if (isOptional) {
                    if (existingMethod.optional)
                        throw "Only one optional wildcard per route and method!";
                    existingMethod.optional = {
                        parser: parser,
                        route: route,
                    };
                }
                else {
                    if (existingMethod.required)
                        throw "Only one required wildcard per route and method!";
                    existingMethod.required = {
                        parser: parser,
                        route: route,
                    };
                }
            }
            else {
                if (isOptional) {
                    if (this.wildcardChildRoutesMethodWildcard.optional)
                        throw "Only one optional wildcard per route and method!";
                    this.wildcardChildRoutesMethodWildcard.optional = {
                        parser: parser,
                        route: route,
                    };
                }
                else {
                    if (this.wildcardChildRoutesMethodWildcard.required)
                        throw "Only one required wildcard per route and method!";
                    this.wildcardChildRoutesMethodWildcard.required = {
                        parser: parser,
                        route: route,
                    };
                }
            }
        }
        else if (route.method === null) {
            let existingRouteGroup = this.staticChildGroupsMethodWildcard.get(slug);
            if (!existingRouteGroup) {
                existingRouteGroup = new RouteGroup(joinPaths(this.path, `/${slug}`));
                this.staticChildGroupsMethodWildcard.set(slug, existingRouteGroup);
            }
            existingRouteGroup.makeRouteGroupsForPath(`/${path.slice(slug.length + 2)}`, route);
        }
        else {
            let existingMethod = this.staticChildGroups.get(route.method);
            if (!existingMethod) {
                existingMethod = new Map();
                this.staticChildGroups.set(route.method, existingMethod);
            }
            let existingRouteGroup = existingMethod.get(slug);
            if (!existingRouteGroup) {
                existingRouteGroup = new RouteGroup(joinPaths(this.path, `/${slug}`));
                existingMethod.set(slug, existingRouteGroup);
            }
            existingRouteGroup.makeRouteGroupsForPath(`/${path.slice(slug.length + 2)}`, route);
        }
    }
    parseOrCatchUnparseable(parser, param, name) {
        if (!parser) {
            return {
                success: true,
                parsed: param,
            };
        }
        try {
            const parsed = parser({
                param: param,
                unparseable: () => throwUnparseableError(name),
            });
            return {
                success: true,
                parsed: parsed,
            };
        }
        catch (err) {
            if (err instanceof UnparseableError) {
                return {
                    success: false,
                    parsed: undefined,
                };
            }
            throw err;
        }
    }
    getRouteFromPath(path, method) {
        const slug = this.getFirstSlugOfPath(path);
        if (slug === "") {
            const route = this.routes.get(method) || this.routeMethodWildcard;
            if (route) {
                return {
                    route: route,
                    params: {},
                };
            }
            const optionalDynamicRouteMetod = this.dynamicChildGroups.get(method) ||
                this.dynamicChildGroupsMethodWildcard;
            if (optionalDynamicRouteMetod) {
                for (const optionalDynamicRoute of optionalDynamicRouteMetod.optional) {
                    const { success, parsed } = this.parseOrCatchUnparseable(optionalDynamicRoute.parser, undefined, optionalDynamicRoute.dynamicSlugVariableName);
                    if (!success)
                        continue;
                    const route = optionalDynamicRoute.routeGroup.getRouteFromPath("/", method);
                    if (!route)
                        continue;
                    route.params[optionalDynamicRoute.dynamicSlugVariableName] =
                        parsed;
                    return route;
                }
            }
            const optionalWildcardRoute = (this.wildcardChildRoutes.get(method) ||
                this.wildcardChildRoutesMethodWildcard)?.optional;
            if (optionalWildcardRoute) {
                const { success, parsed } = this.parseOrCatchUnparseable(optionalWildcardRoute.parser, undefined, "wildcard");
                if (!success)
                    return undefined;
                return {
                    params: { wildcard: parsed },
                    route: optionalWildcardRoute.route,
                };
            }
            return undefined;
        }
        const restPath = `/${path.slice(slug.length + 2)}`;
        const staticChildRoute = this.getRouteFromStaticChildGroup(slug, restPath, method);
        if (staticChildRoute)
            return staticChildRoute;
        const dynamicChildRoute = this.getRouteFromDynamicChildGroup(slug, restPath, method);
        if (dynamicChildRoute)
            return dynamicChildRoute;
        const wildcardRoute = this.getRouteFromWildcardChildGroup(path, method);
        if (wildcardRoute)
            return wildcardRoute;
        return undefined;
    }
    getRouteFromStaticChildGroup(slug, restPath, method) {
        const staticChildGroupsMethod = this.staticChildGroups.get(method) ||
            this.staticChildGroupsMethodWildcard;
        if (!staticChildGroupsMethod)
            return undefined;
        const staticChildGroup = staticChildGroupsMethod.get(slug);
        if (!staticChildGroup)
            return undefined;
        return staticChildGroup.getRouteFromPath(restPath, method);
    }
    getRouteFromDynamicChildGroup(slug, restPath, method) {
        const dynamicChildGroupsMethod = this.dynamicChildGroups.get(method) ||
            this.dynamicChildGroupsMethodWildcard;
        if (!dynamicChildGroupsMethod)
            return undefined;
        for (const dynamicRouteGroup of dynamicChildGroupsMethod.required) {
            const { success, parsed } = this.parseOrCatchUnparseable(dynamicRouteGroup.parser, slug, dynamicRouteGroup.dynamicSlugVariableName);
            if (!success)
                continue;
            const route = dynamicRouteGroup.routeGroup.getRouteFromPath(restPath, method);
            if (!route)
                continue;
            route.params[dynamicRouteGroup.dynamicSlugVariableName] = parsed;
            return route;
        }
        for (const dynamicRouteGroup of dynamicChildGroupsMethod.optional) {
            const { success, parsed } = this.parseOrCatchUnparseable(dynamicRouteGroup.parser, slug, dynamicRouteGroup.dynamicSlugVariableName);
            if (!success)
                continue;
            const route = dynamicRouteGroup.routeGroup.getRouteFromPath(restPath, method);
            if (!route)
                continue;
            route.params[dynamicRouteGroup.dynamicSlugVariableName] = parsed;
            return route;
        }
        return undefined;
    }
    getRouteFromWildcardChildGroup(path, method) {
        const wildcardChildGroupsMethod = this.wildcardChildRoutes.get(method) ||
            this.wildcardChildRoutesMethodWildcard;
        if (!wildcardChildGroupsMethod)
            return undefined;
        const requiredWildcardRoute = wildcardChildGroupsMethod.required;
        if (requiredWildcardRoute) {
            const { success, parsed } = this.parseOrCatchUnparseable(requiredWildcardRoute.parser, path, "wildcard");
            if (success) {
                return {
                    params: { wildcard: parsed },
                    route: requiredWildcardRoute.route,
                };
            }
        }
        const optionalWildcardRoute = wildcardChildGroupsMethod.optional;
        if (optionalWildcardRoute) {
            const { success, parsed } = this.parseOrCatchUnparseable(optionalWildcardRoute.parser, path, "wildcard");
            if (success) {
                return {
                    params: { wildcard: parsed },
                    route: optionalWildcardRoute.route,
                };
            }
        }
        return undefined;
    }
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
export class Router {
    routeBuilders = [];
    groupBuilders = [];
    middleware = [];
    constructor() { }
    /** Handle `get` requests. Shorthand for the `router.on("GET", ...)` method. */
    get(route) {
        return this.on("GET", route);
    }
    /**
     * Handle `post` requests. Shorthand for the `router.on("POST", ...)`
     * method.
     */
    post(route) {
        return this.on("POST", route);
    }
    /** Handle `put` requests. Shorthand for the `router.on("PUT", ...)` method. */
    put(route) {
        return this.on("PUT", route);
    }
    /**
     * Handle `delete` requests. Shorthand for the `router.on("GET", ...)`
     * method.
     */
    delete(route) {
        return this.on("DELETE", route);
    }
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
    on(method, route) {
        const builder = new RouteBuilder(route, [method]);
        this.routeBuilders.push(builder);
        return builder;
    }
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
    all(route) {
        const builder = new RouteBuilderAllMethods(route);
        this.routeBuilders.push(builder);
        return builder;
    }
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
    use(middleware) {
        this.middleware.push({
            type: "Middleware",
            middleware: middleware,
        });
        return this;
    }
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
    before(beforeFunction) {
        this.middleware.push({
            type: "Before",
            before: beforeFunction,
        });
        return this;
    }
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
    group(path) {
        const builder = new RouteGroupBuilder(path);
        this.groupBuilders.push(builder);
        return builder;
    }
    buildRouteBuilders() {
        const parentRouteGroup = new RouteGroup("/");
        for (const builder of this.routeBuilders) {
            for (const route of builder.build()) {
                route.middleware = [
                    ...this.middleware,
                    ...route.middleware,
                ].reverse();
                parentRouteGroup.makeRouteGroupsForPath(route.path, route);
            }
        }
        for (const builder of this.groupBuilders) {
            for (const route of builder.build()) {
                route.middleware = [
                    ...this.middleware,
                    ...route.middleware,
                ].reverse();
                parentRouteGroup.makeRouteGroupsForPath(route.path, route);
            }
        }
        return parentRouteGroup;
    }
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
    listen(port) {
        const routes = this.buildRouteBuilders();
        const server = new Server(routes, "localhost", port, this.middleware.slice().reverse());
        server.listen();
    }
}
