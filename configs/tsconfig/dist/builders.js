import { Route } from "./route.js";
export class RouteBuilder {
    path;
    methods;
    parsers;
    handler;
    middleware = [];
    constructor(path, methods) {
        this.path = path;
        this.methods = methods;
    }
    parse(parsers) {
        this.parsers = parsers;
        return this;
    }
    use(middleware) {
        this.middleware.push({
            type: "Middleware",
            middleware: middleware,
        });
        return this;
    }
    before(beforeFunction) {
        this.middleware.push({
            type: "Before",
            before: beforeFunction,
        });
        return this;
    }
    validate(validators) {
        for (const [type, validator] of Object.entries(validators)) {
            this.middleware.push({
                type: "Validator",
                validator: validator,
                validatorType: type,
            });
        }
        return this;
    }
    on(method) {
        this.methods.push(method);
        return this;
    }
    get() {
        return this.on("GET");
    }
    post() {
        return this.on("POST");
    }
    put() {
        return this.on("PUT");
    }
    delete() {
        return this.on("DELETE");
    }
    handle(handler) {
        this.handler = handler;
    }
    build() {
        if (!this.handler)
            throw "Route builder needs a handler!";
        const routes = [];
        for (const method of this.methods) {
            routes.push(new Route(this.path, method, this.parsers || {}, this.handler, this.middleware.slice()));
        }
        return routes;
    }
}
export class RouteBuilderAllMethods {
    path;
    parsers;
    handler;
    middleware = [];
    constructor(path) {
        this.path = path;
    }
    parse(parsers) {
        this.parsers = parsers;
        return this;
    }
    use(middleware) {
        this.middleware.push({
            type: "Middleware",
            middleware: middleware,
        });
        return this;
    }
    before(beforeFunction) {
        this.middleware.push({
            type: "Before",
            before: beforeFunction,
        });
        return this;
    }
    validate(validators) {
        for (const [type, validator] of Object.entries(validators)) {
            this.middleware.push({
                type: "Validator",
                validator: validator,
                validatorType: type,
            });
        }
        return this;
    }
    handle(handler) {
        this.handler = handler;
    }
    build() {
        if (!this.handler)
            throw "Route builder needs a handler!";
        return [
            new Route(this.path, null, this.parsers || {}, this.handler, this.middleware.slice()),
        ];
    }
}
export class RouteGroupBuilder {
    path;
    parsers;
    routeGroup;
    middleware = [];
    constructor(path) {
        this.path = path;
    }
    parse(parsers) {
        this.parsers = parsers;
        return this;
    }
    use(middleware) {
        this.middleware.push({
            type: "Middleware",
            middleware: middleware,
        });
        return this;
    }
    before(beforeFunction) {
        this.middleware.push({
            type: "Before",
            before: beforeFunction,
        });
        return this;
    }
    validate(validators) {
        for (const [type, validator] of Object.entries(validators)) {
            this.middleware.push({
                type: "Validator",
                validator: validator,
                validatorType: type,
            });
        }
        return this;
    }
    handle() {
        this.routeGroup = new RouteGroupBackend(this.path);
        return this.routeGroup;
    }
    build() {
        if (!this.routeGroup)
            throw "Route group builder needs to be handled!";
        const routes = this.routeGroup.build();
        for (const route of routes) {
            route.middleware = [...this.middleware, ...route.middleware];
        }
        for (const route of routes) {
            route.parsers = { ...route.parsers, ...this.parsers };
        }
        return routes;
    }
}
class RouteGroupBackend {
    path;
    routeBuilders = [];
    groupBuilders = [];
    constructor(path) {
        this.path = path;
    }
    joinPaths(path) {
        return ((this.path === "/" ? "" : this.path) +
            (path === "/" ? "" : path) || "/");
    }
    on(method, path) {
        const builder = new RouteBuilder(this.joinPaths(path), [method]);
        this.routeBuilders.push(builder);
        return builder;
    }
    get(path) {
        return this.on("GET", path);
    }
    post(path) {
        return this.on("POST", path);
    }
    put(path) {
        return this.on("PUT", path);
    }
    delete(path) {
        return this.on("DELETE", path);
    }
    all(path) {
        const builder = new RouteBuilderAllMethods((this.path + path));
        this.routeBuilders.push(builder);
        // IDK why this one needs the as while the on method dosnt
        return builder;
    }
    group(path) {
        const groupBuilder = new RouteGroupBuilder((this.path + path));
        this.groupBuilders.push(groupBuilder);
        return groupBuilder;
    }
    build() {
        const routes = [];
        for (const builder of this.routeBuilders) {
            const built = builder.build();
            routes.push(...built);
        }
        for (const builder of this.groupBuilders) {
            routes.push(...builder.build());
        }
        return routes;
    }
}
