/**
 * Fastify compatibility layer for Bun
 *
 * This module provides Fastify-like request and reply objects,
 * as well as hook and plugin support for Fastify middleware compatibility.
 */

/**
 * Fastify-compatible request object
 */
export interface FastifyRequest {
  // Original Bun request
  readonly raw: Request;

  // Fastify-like properties
  id: string;
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  headers: Record<string, string | undefined>;
  method: string;
  url: string;
  routerPath: string;
  routerMethod: string;
  ip: string;
  ips: string[];
  hostname: string;
  protocol: "http" | "https";
  is404: boolean;

  // Validation (simplified)
  validationError?: Error;

  // Methods
  getValidationFunction(httpPart: string): unknown;
  compileValidationSchema(schema: unknown, httpPart: string): unknown;
  validateInput(input: unknown, schema: unknown, httpPart: string): boolean;
}

/**
 * Fastify-compatible reply object
 */
export interface FastifyReply {
  // Internal state
  readonly _headers: Headers;
  _statusCode: number;
  _body: unknown;
  _sent: boolean;
  sent: boolean;

  // Properties
  statusCode: number;
  elapsedTime: number;

  // Methods
  code(statusCode: number): FastifyReply;
  status(statusCode: number): FastifyReply;
  header(key: string, value: string): FastifyReply;
  headers(headers: Record<string, string>): FastifyReply;
  getHeader(key: string): string | null;
  getHeaders(): Record<string, string>;
  removeHeader(key: string): FastifyReply;
  hasHeader(key: string): boolean;
  type(contentType: string): FastifyReply;
  serializer(fn: (payload: unknown) => string): FastifyReply;
  send(payload?: unknown): void;
  redirect(url: string): FastifyReply;
  redirect(statusCode: number, url: string): FastifyReply;
  callNotFound(): void;
  getResponseTime(): number;

  // Build final response
  _buildResponse(): Response;
}

/**
 * Fastify hook types
 */
export type FastifyHookName =
  | "onRequest"
  | "preParsing"
  | "preValidation"
  | "preHandler"
  | "preSerialization"
  | "onSend"
  | "onResponse"
  | "onTimeout"
  | "onError"
  | "onClose"
  | "onReady"
  | "onListen";

export type FastifyOnRequestHook = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
) => void | Promise<void>;

export type FastifyPreHandlerHook = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
) => void | Promise<void>;

export type FastifyOnSendHook = (
  request: FastifyRequest,
  reply: FastifyReply,
  payload: unknown,
  done: (err?: Error, payload?: unknown) => void
) => void | Promise<void>;

export type FastifyOnErrorHook = (
  request: FastifyRequest,
  reply: FastifyReply,
  error: Error,
  done: (err?: Error) => void
) => void | Promise<void>;

export type FastifyOnResponseHook = (
  request: FastifyRequest,
  reply: FastifyReply,
  done: (err?: Error) => void
) => void | Promise<void>;

/**
 * Fastify plugin interface
 */
export type FastifyPlugin<Options = Record<string, unknown>> = (
  instance: FastifyInstance,
  opts: Options,
  done: (err?: Error) => void
) => void | Promise<void>;

/**
 * Fastify instance interface (subset for compatibility)
 */
export interface FastifyInstance {
  // Decorators
  decorate<T>(name: string, value: T): FastifyInstance;
  decorateRequest<T>(name: string, value: T): FastifyInstance;
  decorateReply<T>(name: string, value: T): FastifyInstance;
  hasDecorator(name: string): boolean;
  hasRequestDecorator(name: string): boolean;
  hasReplyDecorator(name: string): boolean;

  // Hooks
  addHook(name: "onRequest", hook: FastifyOnRequestHook): FastifyInstance;
  addHook(name: "preHandler", hook: FastifyPreHandlerHook): FastifyInstance;
  addHook(name: "onSend", hook: FastifyOnSendHook): FastifyInstance;
  addHook(name: "onError", hook: FastifyOnErrorHook): FastifyInstance;
  addHook(name: "onResponse", hook: FastifyOnResponseHook): FastifyInstance;

  // Plugins
  register<Options>(plugin: FastifyPlugin<Options>, opts?: Options): FastifyInstance;

  // Routing (for completeness)
  get(path: string, handler: FastifyRouteHandler): FastifyInstance;
  post(path: string, handler: FastifyRouteHandler): FastifyInstance;
  put(path: string, handler: FastifyRouteHandler): FastifyInstance;
  delete(path: string, handler: FastifyRouteHandler): FastifyInstance;
  patch(path: string, handler: FastifyRouteHandler): FastifyInstance;
  options(path: string, handler: FastifyRouteHandler): FastifyInstance;
  head(path: string, handler: FastifyRouteHandler): FastifyInstance;
  all(path: string, handler: FastifyRouteHandler): FastifyInstance;

  // Properties
  prefix: string;
}

export type FastifyRouteHandler = (
  request: FastifyRequest,
  reply: FastifyReply
) => unknown | Promise<unknown>;

/**
 * Create a Fastify-compatible request object from a Bun Request
 */
export function createFastifyRequest(
  bunRequest: Request,
  params: Record<string, string> = {},
  requestId?: string
): FastifyRequest {
  const url = new URL(bunRequest.url);

  // Parse headers into object
  const headers: Record<string, string | undefined> = {};
  bunRequest.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Parse query string
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  // Get IP address
  const ip =
    bunRequest.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    bunRequest.headers.get("x-real-ip") ??
    "127.0.0.1";

  const ips = bunRequest.headers.get("x-forwarded-for")?.split(",").map((s) => s.trim()) ?? [ip];

  const req: FastifyRequest = {
    raw: bunRequest,
    id: requestId ?? generateRequestId(),
    params,
    query,
    body: undefined,
    headers,
    method: bunRequest.method,
    url: url.pathname + url.search,
    routerPath: url.pathname,
    routerMethod: bunRequest.method,
    ip,
    ips,
    hostname: url.hostname,
    protocol: url.protocol === "https:" ? "https" : "http",
    is404: false,

    getValidationFunction(_httpPart: string): unknown {
      return undefined;
    },

    compileValidationSchema(_schema: unknown, _httpPart: string): unknown {
      return undefined;
    },

    validateInput(_input: unknown, _schema: unknown, _httpPart: string): boolean {
      return true;
    },
  };

  return req;
}

/**
 * Create a Fastify-compatible reply object
 */
export function createFastifyReply(): FastifyReply {
  const headers = new Headers();
  let statusCode = 200;
  let body: unknown = null;
  let sent = false;
  const startTime = Date.now();
  let serializer: ((payload: unknown) => string) | null = null;

  const reply: FastifyReply = {
    _headers: headers,
    _statusCode: statusCode,
    _body: body,
    _sent: sent,

    get sent() {
      return sent;
    },

    get statusCode() {
      return statusCode;
    },
    set statusCode(code: number) {
      statusCode = code;
      this._statusCode = code;
    },

    get elapsedTime() {
      return Date.now() - startTime;
    },

    code(code: number): FastifyReply {
      statusCode = code;
      this._statusCode = code;
      return this;
    },

    status(code: number): FastifyReply {
      return this.code(code);
    },

    header(key: string, value: string): FastifyReply {
      headers.set(key, value);
      return this;
    },

    headers(newHeaders: Record<string, string>): FastifyReply {
      for (const [key, value] of Object.entries(newHeaders)) {
        headers.set(key, value);
      }
      return this;
    },

    getHeader(key: string): string | null {
      return headers.get(key);
    },

    getHeaders(): Record<string, string> {
      const result: Record<string, string> = {};
      headers.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    },

    removeHeader(key: string): FastifyReply {
      headers.delete(key);
      return this;
    },

    hasHeader(key: string): boolean {
      return headers.has(key);
    },

    type(contentType: string): FastifyReply {
      headers.set("Content-Type", contentType);
      return this;
    },

    serializer(fn: (payload: unknown) => string): FastifyReply {
      serializer = fn;
      return this;
    },

    send(payload?: unknown): void {
      if (sent) {
        console.warn("Reply already sent");
        return;
      }

      if (payload !== undefined) {
        body = payload;
        this._body = body;
      }

      sent = true;
      this._sent = true;
    },

    redirect(statusOrUrl: number | string, url?: string): FastifyReply {
      if (typeof statusOrUrl === "number" && url) {
        statusCode = statusOrUrl;
        this._statusCode = statusCode;
        headers.set("Location", url);
      } else {
        statusCode = 302;
        this._statusCode = statusCode;
        headers.set("Location", statusOrUrl as string);
      }
      sent = true;
      this._sent = true;
      return this;
    },

    callNotFound(): void {
      statusCode = 404;
      this._statusCode = 404;
      body = { statusCode: 404, error: "Not Found", message: "Route not found" };
      this._body = body;
      sent = true;
      this._sent = true;
    },

    getResponseTime(): number {
      return Date.now() - startTime;
    },

    _buildResponse(): Response {
      // Handle redirect
      if (headers.has("Location") && statusCode >= 300 && statusCode < 400) {
        return Response.redirect(headers.get("Location")!, statusCode);
      }

      let responseBody: string | ArrayBuffer | Uint8Array | ReadableStream | Blob | null = null;

      if (body !== null && body !== undefined) {
        if (serializer) {
          responseBody = serializer(body);
        } else if (typeof body === "string") {
          responseBody = body;
          if (!headers.has("Content-Type")) {
            headers.set("Content-Type", "text/plain; charset=utf-8");
          }
        } else if (body instanceof Uint8Array || body instanceof ArrayBuffer) {
          responseBody = body;
          if (!headers.has("Content-Type")) {
            headers.set("Content-Type", "application/octet-stream");
          }
        } else if (body instanceof ReadableStream) {
          responseBody = body;
        } else if (body instanceof Blob) {
          responseBody = body;
        } else {
          responseBody = JSON.stringify(body);
          if (!headers.has("Content-Type")) {
            headers.set("Content-Type", "application/json; charset=utf-8");
          }
        }
      }

      return new Response(responseBody, {
        status: statusCode,
        headers,
      });
    },
  };

  return reply;
}

/**
 * Fastify hooks manager
 */
export class FastifyHooksManager {
  private onRequestHooks: FastifyOnRequestHook[] = [];
  private preHandlerHooks: FastifyPreHandlerHook[] = [];
  private onSendHooks: FastifyOnSendHook[] = [];
  private onErrorHooks: FastifyOnErrorHook[] = [];
  private onResponseHooks: FastifyOnResponseHook[] = [];

  public addHook(name: "onRequest", hook: FastifyOnRequestHook): void;
  public addHook(name: "preHandler", hook: FastifyPreHandlerHook): void;
  public addHook(name: "onSend", hook: FastifyOnSendHook): void;
  public addHook(name: "onError", hook: FastifyOnErrorHook): void;
  public addHook(name: "onResponse", hook: FastifyOnResponseHook): void;
  public addHook(name: FastifyHookName, hook: FastifyOnRequestHook | FastifyPreHandlerHook | FastifyOnSendHook | FastifyOnErrorHook | FastifyOnResponseHook): void {
    switch (name) {
      case "onRequest":
        this.onRequestHooks.push(hook as FastifyOnRequestHook);
        break;
      case "preHandler":
        this.preHandlerHooks.push(hook as FastifyPreHandlerHook);
        break;
      case "onSend":
        this.onSendHooks.push(hook as FastifyOnSendHook);
        break;
      case "onError":
        this.onErrorHooks.push(hook as FastifyOnErrorHook);
        break;
      case "onResponse":
        this.onResponseHooks.push(hook as FastifyOnResponseHook);
        break;
    }
  }

  public async executeOnRequest(request: FastifyRequest, reply: FastifyReply): Promise<Error | undefined> {
    for (const hook of this.onRequestHooks) {
      const result = await this.executeHook(hook, request, reply);
      if (result instanceof Error) return result;
      if (reply.sent) return undefined;
    }
    return undefined;
  }

  public async executePreHandler(request: FastifyRequest, reply: FastifyReply): Promise<Error | undefined> {
    for (const hook of this.preHandlerHooks) {
      const result = await this.executeHook(hook, request, reply);
      if (result instanceof Error) return result;
      if (reply.sent) return undefined;
    }
    return undefined;
  }

  public async executeOnSend(
    request: FastifyRequest,
    reply: FastifyReply,
    payload: unknown
  ): Promise<{ error?: Error; payload: unknown }> {
    let currentPayload = payload;

    for (const hook of this.onSendHooks) {
      const result = await new Promise<{ error?: Error; payload?: unknown }>((resolve) => {
        const maybePromise = hook(request, reply, currentPayload, (err, newPayload) => {
          resolve({ error: err, payload: newPayload ?? currentPayload });
        });

        if (maybePromise instanceof Promise) {
          maybePromise.then(() => resolve({ payload: currentPayload })).catch((err) => resolve({ error: err }));
        }
      });

      if (result.error) {
        return { error: result.error, payload: currentPayload };
      }
      if (result.payload !== undefined) {
        currentPayload = result.payload;
      }
    }

    return { payload: currentPayload };
  }

  public async executeOnError(request: FastifyRequest, reply: FastifyReply, error: Error): Promise<boolean> {
    for (const hook of this.onErrorHooks) {
      let handled = false;
      await new Promise<void>((resolve) => {
        const maybePromise = hook(request, reply, error, (err) => {
          if (!err) handled = true;
          resolve();
        });

        if (maybePromise instanceof Promise) {
          maybePromise.then(() => resolve()).catch(() => resolve());
        }
      });

      if (handled || reply.sent) {
        return true;
      }
    }
    return false;
  }

  public async executeOnResponse(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    for (const hook of this.onResponseHooks) {
      await this.executeHook(hook, request, reply);
    }
  }

  private async executeHook(
    hook: (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => void | Promise<void>,
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<Error | undefined> {
    return new Promise((resolve) => {
      const maybePromise = hook(request, reply, (err) => {
        resolve(err);
      });

      if (maybePromise instanceof Promise) {
        maybePromise.then(() => resolve(undefined)).catch((err) => resolve(err));
      }
    });
  }
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Fastify plugin registry
 */
export class FastifyPluginRegistry {
  private decorators: Map<string, unknown> = new Map();
  private requestDecorators: Map<string, unknown> = new Map();
  private replyDecorators: Map<string, unknown> = new Map();
  private plugins: Array<{ plugin: FastifyPlugin; opts: unknown }> = [];

  public decorate<T>(name: string, value: T): void {
    this.decorators.set(name, value);
  }

  public decorateRequest<T>(name: string, value: T): void {
    this.requestDecorators.set(name, value);
  }

  public decorateReply<T>(name: string, value: T): void {
    this.replyDecorators.set(name, value);
  }

  public hasDecorator(name: string): boolean {
    return this.decorators.has(name);
  }

  public hasRequestDecorator(name: string): boolean {
    return this.requestDecorators.has(name);
  }

  public hasReplyDecorator(name: string): boolean {
    return this.replyDecorators.has(name);
  }

  public getDecorator<T>(name: string): T | undefined {
    return this.decorators.get(name) as T | undefined;
  }

  public register<Options>(plugin: FastifyPlugin<Options>, opts?: Options): void {
    this.plugins.push({ plugin: plugin as FastifyPlugin, opts });
  }

  public async initializePlugins(instance: FastifyInstance): Promise<void> {
    for (const { plugin, opts } of this.plugins) {
      await new Promise<void>((resolve, reject) => {
        const pluginOpts = (opts ?? {}) as Record<string, unknown>;
        const maybePromise = plugin(instance, pluginOpts, (err) => {
          if (err) reject(err);
          else resolve();
        });

        if (maybePromise instanceof Promise) {
          maybePromise.then(resolve).catch(reject);
        }
      });
    }
  }

  public applyRequestDecorators(request: FastifyRequest): void {
    this.requestDecorators.forEach((value, key) => {
      (request as unknown as Record<string, unknown>)[key] = typeof value === "function" ? value() : value;
    });
  }

  public applyReplyDecorators(reply: FastifyReply): void {
    this.replyDecorators.forEach((value, key) => {
      (reply as unknown as Record<string, unknown>)[key] = typeof value === "function" ? value() : value;
    });
  }
}

/**
 * Type for Fastify-style middleware (using hooks pattern)
 */
export type FastifyMiddleware = FastifyOnRequestHook | FastifyPreHandlerHook;

/**
 * Check if a function looks like a Fastify hook/middleware
 * Fastify hooks have 3 params: (request, reply, done)
 * Express middleware has 3 params: (req, res, next) or 4 for error: (err, req, res, next)
 *
 * We differentiate by checking if it's been registered through Fastify's addHook
 */
export function isFastifyMiddleware(fn: (...args: unknown[]) => unknown): boolean {
  // Check for Fastify-specific marker or if registered via addHook
  return (fn as { _fastify?: boolean })._fastify === true;
}

/**
 * Mark a function as Fastify middleware
 */
export function markAsFastify<T extends (...args: unknown[]) => unknown>(fn: T): T {
  (fn as T & { _fastify: boolean })._fastify = true;
  return fn;
}
