import { HttpError } from "./error.js";
export class Route {
    path;
    method;
    parsers;
    handler;
    middleware;
    constructor(path, method, parsers, handler, middleware) {
        this.path = path;
        this.method = method;
        this.parsers = parsers;
        this.handler = handler;
        this.middleware = middleware;
    }
    async handleRequest(params) {
        const tryOrPopulateErrorResponse = async (fn) => {
            try {
                await fn();
            }
            catch (err) {
                if (err instanceof HttpError) {
                    params.response
                        .status(err.status)
                        .json(err.toResponseJson());
                    return;
                }
                throw err;
            }
        };
        const context = {
            request: params.request,
            response: params.response,
        };
        const nextFunctions = [
            () => tryOrPopulateErrorResponse(() => this.handler({
                request: params.request,
                response: params.response,
            })),
        ];
        for (const [i, middleware] of this.middleware.entries()) {
            if (middleware.type === "Middleware") {
                nextFunctions.push(() => tryOrPopulateErrorResponse(() => middleware.middleware(context, nextFunctions[i])));
            }
            else if (middleware.type === "Before") {
                nextFunctions.push(async () => {
                    try {
                        context.request.locals = {
                            ...context.request.locals,
                            ...((await middleware.before(context.request)) ||
                                {}),
                        };
                    }
                    catch (err) {
                        if (err instanceof HttpError) {
                            params.response
                                .status(err.status)
                                .json(err.toResponseJson());
                            return;
                        }
                        throw err;
                    }
                    await nextFunctions[i]();
                });
            }
            else if (middleware.type === "Validator") {
                nextFunctions.push(async () => {
                    if (middleware.validatorType === "body") {
                        const validated = middleware.validator(await context.request.json());
                        if (!validated.success) {
                            context.response.unprocessableContent().json({
                                errors: validated.errors,
                            });
                            return;
                        }
                        context.request.validatedJsonBody = validated.data;
                    }
                    else if (middleware.validatorType === "query") {
                        const validated = middleware.validator(context.request.query.all());
                        if (!validated.success) {
                            context.response.unprocessableContent().json({
                                errors: validated.errors,
                            });
                            return;
                        }
                        context.request.query.validated = validated.data;
                    }
                    await nextFunctions[i]();
                });
            }
        }
        try {
            await nextFunctions.at(-1)();
        }
        catch (err) {
            if (!context.response.stream) {
                context.response.internalServerError().json({
                    message: "Internal server error!",
                });
            }
        }
    }
}
