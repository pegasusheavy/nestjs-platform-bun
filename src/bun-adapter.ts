import type { Server } from "bun";
import { AbstractHttpAdapter } from "@nestjs/core";
import { RequestMethod, type VersioningOptions } from "@nestjs/common";
import { EventEmitter } from "events";

type VersionValue = string | symbol | Array<string | symbol>;
import {
  createExpressRequest,
  createExpressResponse,
  type ExpressRequest,
  type ExpressResponse,
  type ExpressMiddleware,
  type ExpressErrorMiddleware,
} from "./express-compat";
import {
  createFastifyRequest,
  createFastifyReply,
  FastifyHooksManager,
  FastifyPluginRegistry,
  type FastifyPlugin,
  type FastifyInstance,
  type FastifyOnRequestHook,
  type FastifyPreHandlerHook,
  type FastifyOnSendHook,
  type FastifyOnErrorHook,
  type FastifyOnResponseHook,
  type FastifyRouteHandler,
} from "./fastify-compat";

type RouteHandler = (req: ExpressRequest, res: ExpressResponse, next: (err?: unknown) => void) => unknown;
type RequestHandler = RouteHandler;

interface Route {
  path: string | RegExp;
  method: string;
  handler: RouteHandler;
  pathPattern: RegExp;
  paramNames: string[];
}

interface MiddlewareEntry {
  path: string;
  handler: ExpressMiddleware;
}

interface ErrorMiddlewareEntry {
  path: string;
  handler: ExpressErrorMiddleware;
}

/**
 * Wrapper that provides EventEmitter interface for Bun server
 * Required for NestJS compatibility
 */
class BunServerWrapper extends EventEmitter {
  private _server: Server<unknown> | null = null;
  public listening = false;

  public get server(): Server<unknown> | null {
    return this._server;
  }

  public set server(value: Server<unknown> | null) {
    this._server = value;
    if (value) {
      this.listening = true;
      this.emit("listening");
    }
  }

  public address(): { port: number; address: string } | null {
    if (!this._server) return null;
    return {
      port: this._server.port ?? 0,
      address: this._server.hostname ?? "0.0.0.0",
    };
  }

  public close(callback?: () => void): void {
    if (this._server) {
      this._server.stop(true);
      this._server = null;
      this.listening = false;
    }
    if (callback) callback();
    this.emit("close");
  }
}

/**
 * NestJS HTTP adapter for Bun runtime
 *
 * This adapter maps Bun's native HTTP server to the NestJS HTTP abstraction,
 * allowing NestJS applications to run natively on Bun without Express or Fastify.
 *
 * Features full Express and Fastify middleware compatibility.
 */
export class BunAdapter extends AbstractHttpAdapter<BunServerWrapper, Request, Response> {
  private routes: Route[] = [];
  private middlewares: MiddlewareEntry[] = [];
  private errorMiddlewares: ErrorMiddlewareEntry[] = [];
  private globalPrefix = "";
  private isParserRegistered = false;
  private serverWrapper: BunServerWrapper = new BunServerWrapper();

  // Fastify compatibility
  private fastifyHooks: FastifyHooksManager = new FastifyHooksManager();
  private fastifyPlugins: FastifyPluginRegistry = new FastifyPluginRegistry();
  private fastifyInitialized = false;
  private notFoundHandler?: RouteHandler;
  private errorHandler?: (error: Error, req: ExpressRequest, res: ExpressResponse) => void;
  private versioningOptions?: VersioningOptions;

  constructor(instance?: Server<unknown>) {
    super();
    if (instance) {
      this.serverWrapper.server = instance;
    }
    this.setInstance(this.serverWrapper);
  }

  /**
   * Convert a path pattern to a RegExp and extract parameter names
   */
  private pathToRegex(path: string): { pattern: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];

    // Normalize path
    let normalizedPath = path.startsWith("/") ? path : `/${path}`;

    // Handle wildcard routes
    if (normalizedPath.endsWith("*")) {
      normalizedPath = normalizedPath.slice(0, -1) + "(.*)";
    }

    // Extract and replace path parameters
    const regexPath = normalizedPath.replace(/:([a-zA-Z0-9_]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return "([^/]+)";
    });

    return {
      pattern: new RegExp(`^${regexPath}$`),
      paramNames,
    };
  }

  /**
   * Build the full path including global prefix
   */
  private buildPath(path: string): string {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    if (this.globalPrefix) {
      const prefix = this.globalPrefix.startsWith("/") ? this.globalPrefix : `/${this.globalPrefix}`;
      return `${prefix}${normalizedPath}`.replace(/\/+/g, "/");
    }
    return normalizedPath;
  }

  /**
   * Check if a path matches a middleware path (prefix matching)
   */
  private pathMatchesMiddleware(requestPath: string, middlewarePath: string): boolean {
    if (middlewarePath === "/" || middlewarePath === "") {
      return true;
    }
    const normalizedMiddlewarePath = middlewarePath.startsWith("/") ? middlewarePath : `/${middlewarePath}`;
    return requestPath === normalizedMiddlewarePath || requestPath.startsWith(normalizedMiddlewarePath + "/");
  }

  /**
   * Register a route handler
   */
  private addRoute(method: string, path: string, handler: RouteHandler): void {
    const fullPath = this.buildPath(path);
    const { pattern, paramNames } = this.pathToRegex(fullPath);

    this.routes.push({
      path: fullPath,
      method: method.toUpperCase(),
      handler,
      pathPattern: pattern,
      paramNames,
    });
  }

  /**
   * Parse request body based on content type
   */
  private async parseRequestBody(bunRequest: Request): Promise<unknown> {
    const contentType = bunRequest.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      try {
        return await bunRequest.json();
      } catch {
        return undefined;
      }
    }

    if (contentType.includes("application/x-www-form-urlencoded")) {
      try {
        const text = await bunRequest.text();
        const params = new URLSearchParams(text);
        const body: Record<string, string> = {};
        params.forEach((value, key) => {
          body[key] = value;
        });
        return body;
      } catch {
        return undefined;
      }
    }

    if (contentType.includes("multipart/form-data")) {
      try {
        const formData = await bunRequest.formData();
        const body: Record<string, unknown> = {};
        formData.forEach((value, key) => {
          body[key] = value;
        });
        return body;
      } catch {
        return undefined;
      }
    }

    if (contentType.includes("text/")) {
      try {
        return await bunRequest.text();
      } catch {
        return undefined;
      }
    }

    return undefined;
  }

  /**
   * Execute middleware chain
   */
  private async executeMiddlewareChain(
    middlewares: MiddlewareEntry[],
    req: ExpressRequest,
    res: ExpressResponse,
    pathname: string,
    startIndex: number = 0
  ): Promise<{ error?: unknown; completed: boolean }> {
    for (let i = startIndex; i < middlewares.length; i++) {
      const middleware = middlewares[i];
      const middlewarePath = this.buildPath(middleware.path);

      if (!this.pathMatchesMiddleware(pathname, middlewarePath)) {
        continue;
      }

      let nextCalled = false;
      let nextError: unknown = undefined;

      const next = (err?: unknown) => {
        nextCalled = true;
        if (err) {
          nextError = err;
        }
      };

      try {
        await middleware.handler(req, res, next);
      } catch (err) {
        return { error: err, completed: false };
      }

      // If there was an error passed to next, return it
      if (nextError) {
        return { error: nextError, completed: false };
      }

      // If response was ended, stop the chain
      if (res._ended) {
        return { completed: true };
      }

      // If next wasn't called and response not ended, stop
      if (!nextCalled) {
        return { completed: true };
      }
    }

    return { completed: false };
  }

  /**
   * Execute error middleware chain
   */
  private async executeErrorMiddlewareChain(
    error: unknown,
    req: ExpressRequest,
    res: ExpressResponse,
    pathname: string
  ): Promise<boolean> {
    for (const middleware of this.errorMiddlewares) {
      const middlewarePath = this.buildPath(middleware.path);

      if (!this.pathMatchesMiddleware(pathname, middlewarePath)) {
        continue;
      }

      let nextCalled = false;
      let nextError: unknown = undefined;

      const next = (err?: unknown) => {
        nextCalled = true;
        if (err) {
          nextError = err;
        }
      };

      try {
        await middleware.handler(error, req, res, next);
      } catch {
        // Error in error handler, try next error handler
        continue;
      }

      // If response was ended, we're done
      if (res._ended) {
        return true;
      }

      // If next was called with an error, continue to next error handler
      if (nextError) {
        error = nextError;
        continue;
      }

      // If next was called without error, we're done
      if (nextCalled) {
        return true;
      }

      // Handler didn't call next and didn't end response - assume it handled it
      return true;
    }

    return false;
  }

  /**
   * Main request handler that routes incoming requests
   */
  private async handleRequest(bunRequest: Request): Promise<Response> {
    const url = new URL(bunRequest.url);
    const pathname = url.pathname;
    const method = bunRequest.method.toUpperCase();

    // Find matching route first to get params
    let matchedRoute: Route | undefined;
    const params: Record<string, string> = {};

    for (const route of this.routes) {
      if (route.method !== method && route.method !== "ALL") {
        continue;
      }

      const match = pathname.match(route.pathPattern);
      if (match) {
        matchedRoute = route;
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        break;
      }
    }

    // Create Express-compatible request and response
    const req = createExpressRequest(bunRequest, params);
    const res = createExpressResponse();

    // Create Fastify-compatible request and reply
    const fastifyReq = createFastifyRequest(bunRequest, params);
    const fastifyReply = createFastifyReply();

    // Apply Fastify decorators
    this.fastifyPlugins.applyRequestDecorators(fastifyReq);
    this.fastifyPlugins.applyReplyDecorators(fastifyReply);

    // Parse body
    const parsedBody = await this.parseRequestBody(bunRequest);
    req.body = parsedBody;
    fastifyReq.body = parsedBody;

    try {
      // Execute Fastify onRequest hooks
      const onRequestError = await this.fastifyHooks.executeOnRequest(fastifyReq, fastifyReply);
      if (onRequestError) {
        const errorHandled = await this.fastifyHooks.executeOnError(fastifyReq, fastifyReply, onRequestError);
        if (!errorHandled) {
          fastifyReply.code(500).send({
            statusCode: 500,
            error: "Internal Server Error",
            message: onRequestError.message,
          });
        }
        return fastifyReply._buildResponse();
      }

      // If Fastify reply was sent during onRequest hooks
      if (fastifyReply.sent) {
        return fastifyReply._buildResponse();
      }

      // Execute Express middleware chain
      const middlewareResult = await this.executeMiddlewareChain(this.middlewares, req, res, pathname);

      // If middleware returned an error, handle it
      if (middlewareResult.error) {
        const errorHandled = await this.executeErrorMiddlewareChain(middlewareResult.error, req, res, pathname);
        if (!errorHandled) {
          // Use default error handler
          if (this.errorHandler) {
            this.errorHandler(middlewareResult.error as Error, req, res);
          } else {
            res.status(500).json({
              statusCode: 500,
              message: middlewareResult.error instanceof Error ? middlewareResult.error.message : "Internal Server Error",
            });
          }
        }
        return res._buildResponse();
      }

      // If middleware ended the response, return it
      if (middlewareResult.completed || res._ended) {
        return res._buildResponse();
      }

      // Execute Fastify preHandler hooks
      const preHandlerError = await this.fastifyHooks.executePreHandler(fastifyReq, fastifyReply);
      if (preHandlerError) {
        const errorHandled = await this.fastifyHooks.executeOnError(fastifyReq, fastifyReply, preHandlerError);
        if (!errorHandled) {
          fastifyReply.code(500).send({
            statusCode: 500,
            error: "Internal Server Error",
            message: preHandlerError.message,
          });
        }
        return fastifyReply._buildResponse();
      }

      // If Fastify reply was sent during preHandler hooks
      if (fastifyReply.sent) {
        return fastifyReply._buildResponse();
      }

      // Execute route handler
      if (matchedRoute) {
        let _nextCalled = false;
        let nextError: unknown = undefined;

        const next = (err?: unknown) => {
          _nextCalled = true;
          if (err) {
            nextError = err;
          }
        };

        try {
          const handlerResult = await matchedRoute.handler(req, res, next);

          // If next was called with an error, handle it
          if (nextError) {
            const errorHandled = await this.executeErrorMiddlewareChain(nextError, req, res, pathname);
            if (!errorHandled) {
              // Try Fastify error hooks
              const fastifyErrorHandled = await this.fastifyHooks.executeOnError(
                fastifyReq,
                fastifyReply,
                nextError instanceof Error ? nextError : new Error(String(nextError))
              );
              if (!fastifyErrorHandled) {
                if (this.errorHandler) {
                  this.errorHandler(nextError as Error, req, res);
                } else {
                  res.status(500).json({
                    statusCode: 500,
                    message: nextError instanceof Error ? nextError.message : "Internal Server Error",
                  });
                }
              } else {
                return fastifyReply._buildResponse();
              }
            }
            return res._buildResponse();
          }

          // If handler returned a value and response not ended, use it
          if (!res._ended && handlerResult !== undefined && handlerResult !== null) {
            if (handlerResult instanceof Response) {
              // Execute Fastify onResponse hooks
              await this.fastifyHooks.executeOnResponse(fastifyReq, fastifyReply);
              return handlerResult;
            }
            res.send(handlerResult);
          }

          // Execute Fastify onSend hooks
          const onSendResult = await this.fastifyHooks.executeOnSend(fastifyReq, fastifyReply, res._body);
          if (onSendResult.error) {
            const errorHandled = await this.fastifyHooks.executeOnError(fastifyReq, fastifyReply, onSendResult.error);
            if (!errorHandled) {
              res.status(500).json({
                statusCode: 500,
                message: onSendResult.error.message,
              });
            } else {
              return fastifyReply._buildResponse();
            }
          }

          const response = res._buildResponse();

          // Execute Fastify onResponse hooks
          await this.fastifyHooks.executeOnResponse(fastifyReq, fastifyReply);

          return response;
        } catch (error) {
          const errorHandled = await this.executeErrorMiddlewareChain(error, req, res, pathname);
          if (!errorHandled) {
            // Try Fastify error hooks
            const fastifyErrorHandled = await this.fastifyHooks.executeOnError(
              fastifyReq,
              fastifyReply,
              error instanceof Error ? error : new Error(String(error))
            );
            if (!fastifyErrorHandled) {
              if (this.errorHandler) {
                this.errorHandler(error as Error, req, res);
              } else {
                res.status(500).json({
                  statusCode: 500,
                  message: error instanceof Error ? error.message : "Internal Server Error",
                });
              }
            } else {
              return fastifyReply._buildResponse();
            }
          }
          return res._buildResponse();
        }
      }

      // No route found
      if (this.notFoundHandler) {
        await this.notFoundHandler(req, res, () => {});
        return res._buildResponse();
      }

      return new Response(JSON.stringify({ statusCode: 404, message: "Not Found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Top-level error handling
      if (this.errorHandler) {
        this.errorHandler(error as Error, req, res);
        return res._buildResponse();
      }

      return new Response(
        JSON.stringify({
          statusCode: 500,
          message: error instanceof Error ? error.message : "Internal Server Error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // ==================== HTTP Method Handlers ====================

  public get(handler: RequestHandler): void;
  public get(path: string, handler: RequestHandler): void;
  public get(pathOrHandler: string | RequestHandler, handler?: RequestHandler): void {
    if (typeof pathOrHandler === "function") {
      this.addRoute("GET", "/", pathOrHandler);
    } else {
      this.addRoute("GET", pathOrHandler, handler!);
    }
  }

  public post(handler: RequestHandler): void;
  public post(path: string, handler: RequestHandler): void;
  public post(pathOrHandler: string | RequestHandler, handler?: RequestHandler): void {
    if (typeof pathOrHandler === "function") {
      this.addRoute("POST", "/", pathOrHandler);
    } else {
      this.addRoute("POST", pathOrHandler, handler!);
    }
  }

  public put(handler: RequestHandler): void;
  public put(path: string, handler: RequestHandler): void;
  public put(pathOrHandler: string | RequestHandler, handler?: RequestHandler): void {
    if (typeof pathOrHandler === "function") {
      this.addRoute("PUT", "/", pathOrHandler);
    } else {
      this.addRoute("PUT", pathOrHandler, handler!);
    }
  }

  public delete(handler: RequestHandler): void;
  public delete(path: string, handler: RequestHandler): void;
  public delete(pathOrHandler: string | RequestHandler, handler?: RequestHandler): void {
    if (typeof pathOrHandler === "function") {
      this.addRoute("DELETE", "/", pathOrHandler);
    } else {
      this.addRoute("DELETE", pathOrHandler, handler!);
    }
  }

  public patch(handler: RequestHandler): void;
  public patch(path: string, handler: RequestHandler): void;
  public patch(pathOrHandler: string | RequestHandler, handler?: RequestHandler): void {
    if (typeof pathOrHandler === "function") {
      this.addRoute("PATCH", "/", pathOrHandler);
    } else {
      this.addRoute("PATCH", pathOrHandler, handler!);
    }
  }

  public options(handler: RequestHandler): void;
  public options(path: string, handler: RequestHandler): void;
  public options(pathOrHandler: string | RequestHandler, handler?: RequestHandler): void {
    if (typeof pathOrHandler === "function") {
      this.addRoute("OPTIONS", "/", pathOrHandler);
    } else {
      this.addRoute("OPTIONS", pathOrHandler, handler!);
    }
  }

  public head(handler: RequestHandler): void;
  public head(path: string, handler: RequestHandler): void;
  public head(pathOrHandler: string | RequestHandler, handler?: RequestHandler): void {
    if (typeof pathOrHandler === "function") {
      this.addRoute("HEAD", "/", pathOrHandler);
    } else {
      this.addRoute("HEAD", pathOrHandler, handler!);
    }
  }

  public all(handler: RequestHandler): void;
  public all(path: string, handler: RequestHandler): void;
  public all(pathOrHandler: string | RequestHandler, handler?: RequestHandler): void {
    if (typeof pathOrHandler === "function") {
      this.addRoute("ALL", "/", pathOrHandler);
    } else {
      this.addRoute("ALL", pathOrHandler, handler!);
    }
  }

  // ==================== Server Lifecycle ====================

  public async listen(port: string | number, callback?: () => void): Promise<void>;
  public async listen(port: string | number, hostname: string, callback?: () => void): Promise<void>;
  public async listen(
    port: string | number,
    hostnameOrCallback?: string | (() => void),
    callback?: () => void
  ): Promise<void> {
    const numericPort = typeof port === "string" ? parseInt(port, 10) : port;
    const hostname = typeof hostnameOrCallback === "string" ? hostnameOrCallback : "0.0.0.0";
    const cb = typeof hostnameOrCallback === "function" ? hostnameOrCallback : callback;

    // Initialize Fastify plugins before starting server
    await this.initializeFastifyPlugins();

    const server = Bun.serve({
      port: numericPort,
      hostname,
      fetch: (req) => this.handleRequest(req),
      error: (error) => {
        this.serverWrapper.emit("error", error);
        return new Response(JSON.stringify({ statusCode: 500, message: "Internal Server Error" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      },
    });

    this.serverWrapper.server = server;

    if (cb) {
      cb();
    }
  }

  public async close(): Promise<void> {
    this.serverWrapper.close();
  }

  // ==================== Middleware & Configuration ====================

  /**
   * Register Express-style middleware
   *
   * Supports:
   * - `use(middleware)` - global middleware
   * - `use(path, middleware)` - path-specific middleware
   * - `use(errorMiddleware)` - error middleware (4 arguments)
   * - `use(path, errorMiddleware)` - path-specific error middleware
   */
  public use(...args: unknown[]): void {
    type MiddlewareFn = ExpressMiddleware | ExpressErrorMiddleware;
    if (args.length === 1 && typeof args[0] === "function") {
      const fn = args[0] as MiddlewareFn;
      // Check if it's an error middleware (4 parameters)
      if (fn.length === 4) {
        this.errorMiddlewares.push({
          path: "/",
          handler: fn as ExpressErrorMiddleware,
        });
      } else {
        this.middlewares.push({
          path: "/",
          handler: fn as ExpressMiddleware,
        });
      }
    } else if (args.length >= 2 && typeof args[0] === "string") {
      const path = args[0] as string;
      // Handle multiple middleware functions
      for (let i = 1; i < args.length; i++) {
        if (typeof args[i] === "function") {
          const fn = args[i] as MiddlewareFn;
          if (fn.length === 4) {
            this.errorMiddlewares.push({
              path,
              handler: fn as ExpressErrorMiddleware,
            });
          } else {
            this.middlewares.push({
              path,
              handler: fn as ExpressMiddleware,
            });
          }
        }
      }
    } else if (args.length >= 1) {
      // Handle array of middleware or multiple middleware functions
      for (const arg of args) {
        if (typeof arg === "function") {
          const fn = arg as MiddlewareFn;
          if (fn.length === 4) {
            this.errorMiddlewares.push({
              path: "/",
              handler: fn as ExpressErrorMiddleware,
            });
          } else {
            this.middlewares.push({
              path: "/",
              handler: fn as ExpressMiddleware,
            });
          }
        } else if (Array.isArray(arg)) {
          for (const middleware of arg) {
            if (typeof middleware === "function") {
              const fn = middleware as MiddlewareFn;
              if (fn.length === 4) {
                this.errorMiddlewares.push({
                  path: "/",
                  handler: fn as ExpressErrorMiddleware,
                });
              } else {
                this.middlewares.push({
                  path: "/",
                  handler: fn as ExpressMiddleware,
                });
              }
            }
          }
        }
      }
    }
  }

  public setGlobalPrefix(prefix: string): void {
    this.globalPrefix = prefix;
  }

  public enableCors(options?: {
    origin?: string | string[] | boolean | ((origin: string, callback: (err: Error | null, allow?: boolean) => void) => void);
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
    preflightContinue?: boolean;
    optionsSuccessStatus?: number;
  }): void {
    const corsOptions = {
      origin: options?.origin ?? "*",
      methods: options?.methods ?? "GET,HEAD,PUT,PATCH,POST,DELETE",
      allowedHeaders: options?.allowedHeaders ?? "*",
      exposedHeaders: options?.exposedHeaders ?? "",
      credentials: options?.credentials ?? false,
      maxAge: options?.maxAge ?? 86400,
      preflightContinue: options?.preflightContinue ?? false,
      optionsSuccessStatus: options?.optionsSuccessStatus ?? 204,
    };

    this.use((req: ExpressRequest, res: ExpressResponse, next: (err?: unknown) => void) => {
      const requestOrigin = req.get("origin") ?? "";

      // Determine the allowed origin
      let allowOrigin = "*";
      if (typeof corsOptions.origin === "boolean") {
        allowOrigin = corsOptions.origin ? requestOrigin || "*" : "";
      } else if (typeof corsOptions.origin === "string") {
        allowOrigin = corsOptions.origin;
      } else if (Array.isArray(corsOptions.origin)) {
        if (corsOptions.origin.includes(requestOrigin)) {
          allowOrigin = requestOrigin;
        } else {
          allowOrigin = corsOptions.origin[0] ?? "*";
        }
      } else if (typeof corsOptions.origin === "function") {
        // For function-based origin, we'd need async handling
        // For simplicity, default to allowing the request origin
        allowOrigin = requestOrigin || "*";
      }

      const methods = Array.isArray(corsOptions.methods)
        ? corsOptions.methods.join(",")
        : corsOptions.methods;

      const allowedHeaders = Array.isArray(corsOptions.allowedHeaders)
        ? corsOptions.allowedHeaders.join(",")
        : corsOptions.allowedHeaders;

      const exposedHeaders = Array.isArray(corsOptions.exposedHeaders)
        ? corsOptions.exposedHeaders.join(",")
        : corsOptions.exposedHeaders;

      // Set CORS headers
      res.set("Access-Control-Allow-Origin", allowOrigin);
      res.set("Access-Control-Allow-Methods", methods);
      res.set("Access-Control-Allow-Headers", allowedHeaders);

      if (exposedHeaders) {
        res.set("Access-Control-Expose-Headers", exposedHeaders);
      }

      if (corsOptions.credentials) {
        res.set("Access-Control-Allow-Credentials", "true");
      }

      res.set("Access-Control-Max-Age", String(corsOptions.maxAge));

      // Handle preflight
      if (req.method === "OPTIONS") {
        if (corsOptions.preflightContinue) {
          next();
        } else {
          res.status(corsOptions.optionsSuccessStatus).end();
        }
        return;
      }

      next();
    });
  }

  // ==================== Fastify Compatibility ====================

  /**
   * Add a Fastify-style hook
   *
   * Supports:
   * - `addHook('onRequest', hook)` - runs at start of request
   * - `addHook('preHandler', hook)` - runs before route handler
   * - `addHook('onSend', hook)` - runs before sending response
   * - `addHook('onError', hook)` - runs when an error occurs
   * - `addHook('onResponse', hook)` - runs after response is sent
   */
  public addHook(name: "onRequest", hook: FastifyOnRequestHook): this;
  public addHook(name: "preHandler", hook: FastifyPreHandlerHook): this;
  public addHook(name: "onSend", hook: FastifyOnSendHook): this;
  public addHook(name: "onError", hook: FastifyOnErrorHook): this;
  public addHook(name: "onResponse", hook: FastifyOnResponseHook): this;
  public addHook(name: string, hook: FastifyOnRequestHook | FastifyPreHandlerHook | FastifyOnSendHook | FastifyOnErrorHook | FastifyOnResponseHook): this {
    this.fastifyHooks.addHook(name as "onRequest", hook as FastifyOnRequestHook);
    return this;
  }

  /**
   * Register a Fastify plugin
   *
   * @example
   * ```typescript
   * app.register(async (instance, opts) => {
   *   instance.addHook('onRequest', async (req, reply) => {
   *     console.log('Request received');
   *   });
   * });
   * ```
   */
  public register<Options = Record<string, unknown>>(
    plugin: FastifyPlugin<Options>,
    opts?: Options
  ): this {
    this.fastifyPlugins.register(plugin, opts);
    return this;
  }

  /**
   * Decorate the Fastify instance
   */
  public decorate<T>(name: string, value: T): this {
    this.fastifyPlugins.decorate(name, value);
    return this;
  }

  /**
   * Decorate request objects
   */
  public decorateRequest<T>(name: string, value: T): this {
    this.fastifyPlugins.decorateRequest(name, value);
    return this;
  }

  /**
   * Decorate reply objects
   */
  public decorateReply<T>(name: string, value: T): this {
    this.fastifyPlugins.decorateReply(name, value);
    return this;
  }

  /**
   * Check if a decorator exists
   */
  public hasDecorator(name: string): boolean {
    return this.fastifyPlugins.hasDecorator(name);
  }

  /**
   * Check if a request decorator exists
   */
  public hasRequestDecorator(name: string): boolean {
    return this.fastifyPlugins.hasRequestDecorator(name);
  }

  /**
   * Check if a reply decorator exists
   */
  public hasReplyDecorator(name: string): boolean {
    return this.fastifyPlugins.hasReplyDecorator(name);
  }

  /**
   * Initialize Fastify plugins (called before listening)
   */
  private async initializeFastifyPlugins(): Promise<void> {
    if (this.fastifyInitialized) return;

    const instance: FastifyInstance = {
      prefix: this.globalPrefix,
      decorate: <T>(name: string, value: T) => {
        this.decorate(name, value);
        return instance;
      },
      decorateRequest: <T>(name: string, value: T) => {
        this.decorateRequest(name, value);
        return instance;
      },
      decorateReply: <T>(name: string, value: T) => {
        this.decorateReply(name, value);
        return instance;
      },
      hasDecorator: (name: string) => this.hasDecorator(name),
      hasRequestDecorator: (name: string) => this.hasRequestDecorator(name),
      hasReplyDecorator: (name: string) => this.hasReplyDecorator(name),
      addHook: ((name: string, hook: FastifyOnRequestHook | FastifyPreHandlerHook | FastifyOnSendHook | FastifyOnErrorHook | FastifyOnResponseHook) => {
        this.addHook(name as "onRequest", hook as FastifyOnRequestHook);
        return instance;
      }) as FastifyInstance["addHook"],
      register: <Options>(plugin: FastifyPlugin<Options>, opts?: Options) => {
        this.register(plugin, opts);
        return instance;
      },
      get: (path: string, handler: FastifyRouteHandler) => {
        this.get(path, this.wrapFastifyHandler(handler));
        return instance;
      },
      post: (path: string, handler: FastifyRouteHandler) => {
        this.post(path, this.wrapFastifyHandler(handler));
        return instance;
      },
      put: (path: string, handler: FastifyRouteHandler) => {
        this.put(path, this.wrapFastifyHandler(handler));
        return instance;
      },
      delete: (path: string, handler: FastifyRouteHandler) => {
        this.delete(path, this.wrapFastifyHandler(handler));
        return instance;
      },
      patch: (path: string, handler: FastifyRouteHandler) => {
        this.patch(path, this.wrapFastifyHandler(handler));
        return instance;
      },
      options: (path: string, handler: FastifyRouteHandler) => {
        this.options(path, this.wrapFastifyHandler(handler));
        return instance;
      },
      head: (path: string, handler: FastifyRouteHandler) => {
        this.head(path, this.wrapFastifyHandler(handler));
        return instance;
      },
      all: (path: string, handler: FastifyRouteHandler) => {
        this.all(path, this.wrapFastifyHandler(handler));
        return instance;
      },
    };

    await this.fastifyPlugins.initializePlugins(instance);
    this.fastifyInitialized = true;
  }

  /**
   * Wrap a Fastify route handler to work with Express-style routing
   */
  private wrapFastifyHandler(handler: FastifyRouteHandler): RouteHandler {
    return async (req: ExpressRequest, res: ExpressResponse, next: (err?: unknown) => void) => {
      const fastifyReq = createFastifyRequest(req.raw, req.params);
      fastifyReq.body = req.body;
      const fastifyReply = createFastifyReply();

      this.fastifyPlugins.applyRequestDecorators(fastifyReq);
      this.fastifyPlugins.applyReplyDecorators(fastifyReply);

      try {
        const result = await handler(fastifyReq, fastifyReply);

        if (fastifyReply.sent) {
          const builtResponse = fastifyReply._buildResponse();
          res.status(fastifyReply.statusCode);
          builtResponse.headers.forEach((value, key) => {
            res.set(key, value);
          });
          if (fastifyReply._body !== null && fastifyReply._body !== undefined) {
            res.send(fastifyReply._body);
          } else {
            res.end();
          }
          return;
        }

        if (result !== undefined) {
          return result;
        }
      } catch (error) {
        next(error);
      }
    };
  }

  // ==================== Request/Response Helpers ====================

  public getRequestMethod(request: Request): string {
    return request.method;
  }

  public getRequestUrl(request: Request): string {
    return new URL(request.url).pathname;
  }

  public getRequestHostname(request: Request): string {
    return new URL(request.url).hostname;
  }

  public reply(response: unknown, body: unknown, statusCode?: number): unknown {
    // Handle ExpressResponse from our middleware
    const expressRes = response as ExpressResponse;
    if (expressRes && typeof expressRes.status === "function" && typeof expressRes.send === "function") {
      if (statusCode) {
        expressRes.status(statusCode);
      }

      if (body === null || body === undefined) {
        expressRes.end();
        return expressRes;
      }

      if (typeof body === "object" && !(body instanceof Uint8Array) && !(body instanceof ArrayBuffer) && !(body instanceof ReadableStream)) {
        expressRes.json(body);
      } else {
        expressRes.send(body);
      }
      return expressRes;
    }

    // Handle native Response
    const nativeRes = response as Response;
    const status = statusCode ?? 200;
    const headers = new Headers(nativeRes.headers);

    if (body === null || body === undefined) {
      return new Response(null, { status, headers });
    }

    if (typeof body === "string") {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "text/plain");
      }
      return new Response(body, { status, headers });
    }

    if (body instanceof Uint8Array || body instanceof ArrayBuffer) {
      if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/octet-stream");
      }
      return new Response(body, { status, headers });
    }

    if (body instanceof ReadableStream) {
      return new Response(body, { status, headers });
    }

    // Default to JSON
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return new Response(JSON.stringify(body), { status, headers });
  }

  public end(_response: Response, _message?: string): void {
    // In Bun's model, responses are immutable and returned directly
    // This method is provided for compatibility but is a no-op
  }

  public status(response: Response, statusCode: number): Response {
    return new Response(response.body, {
      status: statusCode,
      statusText: response.statusText,
      headers: response.headers,
    });
  }

  public redirect(response: Response, statusCode: number, url: string): Response {
    return Response.redirect(url, statusCode);
  }

  public setHeader(response: Response, name: string, value: string): Response {
    const headers = new Headers(response.headers);
    headers.set(name, value);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  public setErrorHandler(handler: (error: Error, req: ExpressRequest, res: ExpressResponse) => void): void {
    this.errorHandler = handler;
  }

  public setNotFoundHandler(handler: RouteHandler): void {
    this.notFoundHandler = handler;
  }

  public isHeadersSent(_response: Response): boolean {
    // In Bun's model, headers are sent with the response
    return false;
  }

  public getHeader(response: Response, name: string): string | null {
    return response.headers.get(name);
  }

  public appendHeader(response: Response, name: string, value: string): Response {
    const headers = new Headers(response.headers);
    headers.append(name, value);
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  // ==================== Body Parsers ====================

  public useBodyParser(
    _type: "json" | "urlencoded" | "text" | "raw",
    _rawBody?: boolean,
    _options?: Record<string, unknown>
  ): void {
    // Body parsing is handled in handleRequest
    // This is provided for API compatibility
    this.isParserRegistered = true;
  }

  public registerParserMiddleware(_prefix?: string, _rawBody?: boolean): void {
    // Body parsing is handled in handleRequest
    this.isParserRegistered = true;
  }

  // ==================== View Engine (Optional) ====================

  public setViewEngine(_engine: string): void {
    // View engines would require additional implementation
    console.warn("View engines are not yet supported in BunAdapter");
  }

  public render(_response: Response, _view: string, _options: Record<string, unknown>): void {
    // View rendering would require additional implementation
    console.warn("View rendering is not yet supported in BunAdapter");
  }

  // ==================== Versioning ====================

  public applyVersionFilter(
    handler: (...args: unknown[]) => unknown,
    _version: VersionValue,
    versioningOptions: VersioningOptions
  ): (_req: Request, _res: Response, _next: () => void) => (...args: unknown[]) => unknown {
    this.versioningOptions = versioningOptions;
    return (_req: Request, _res: Response, _next: () => void) => handler;
  }

  // ==================== Static Assets ====================

  public useStaticAssets(path: string, options?: { prefix?: string }): void {
    const prefix = options?.prefix ?? "/";

    this.get(`${prefix}*`, async (req: ExpressRequest, res: ExpressResponse, next: (err?: unknown) => void) => {
      const filePath = req.path.replace(prefix, "");
      const fullPath = `${path}${filePath}`;

      try {
        const file = Bun.file(fullPath);
        if (await file.exists()) {
          const content = await file.arrayBuffer();
          res.type(file.type);
          res.send(new Uint8Array(content));
          return;
        }
        next();
      } catch {
        next();
      }
    });
  }

  // ==================== Type Helpers ====================

  public getType(): string {
    return "bun";
  }

  public getInstance<T = BunServerWrapper>(): T {
    return this.serverWrapper as unknown as T;
  }

  public initHttpServer(): void {
    // Set the server wrapper as the httpServer
    // This provides EventEmitter interface for NestJS compatibility
    (this as unknown as { httpServer: BunServerWrapper }).httpServer = this.serverWrapper;
  }

  public getHttpServer(): BunServerWrapper {
    return this.serverWrapper;
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  public createMiddlewareFactory(method: RequestMethod): (path: string, callback: Function) => void {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    return (path: string, callback: Function) => {
      const methodName = RequestMethod[method];
      this.addRoute(methodName, path, callback as RouteHandler);
    };
  }
}
