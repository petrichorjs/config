import { RouteGroup } from "./router.js";
import { MiddlewareOrBefore } from "./builders.js";
export declare class Server {
    private readonly baseRouteGroup;
    readonly host: string;
    readonly port: number;
    readonly routerMiddleware: MiddlewareOrBefore[];
    private readonly server;
    constructor(baseRouteGroup: RouteGroup, host: string, port: number, routerMiddleware: MiddlewareOrBefore[]);
    listen(): void;
    private requestHandler;
}
