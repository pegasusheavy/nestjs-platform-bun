/**
 * Express compatibility layer for Bun
 *
 * This module provides Express-like request and response objects
 * that wrap Bun's native Request/Response to enable Express middleware compatibility.
 */

/**
 * Express-compatible request object
 */
export interface ExpressRequest {
  // Original Bun request
  readonly raw: Request;

  // Express-like properties
  method: string;
  url: string;
  originalUrl: string;
  path: string;
  baseUrl: string;
  hostname: string;
  ip: string;
  ips: string[];
  protocol: string;
  secure: boolean;
  subdomains: string[];
  xhr: boolean;

  // Parsed data
  params: Record<string, string>;
  query: Record<string, string>;
  body: unknown;
  cookies: Record<string, string>;
  signedCookies: Record<string, string>;

  // Headers
  headers: Record<string, string | string[] | undefined>;

  // Methods
  get(field: string): string | undefined;
  header(field: string): string | undefined;
  accepts(...types: string[]): string | false;
  acceptsCharsets(...charsets: string[]): string | false;
  acceptsEncodings(...encodings: string[]): string | false;
  acceptsLanguages(...languages: string[]): string | false;
  is(type: string): string | false | null;
  range(size: number, options?: { combine?: boolean }): number | number[][] | -1 | -2 | undefined;
}

/**
 * Express-compatible response object
 */
export interface ExpressResponse {
  // Internal state
  readonly _headers: Headers;
  _statusCode: number;
  _body: unknown;
  _ended: boolean;
  headersSent: boolean;
  locals: Record<string, unknown>;

  // Status
  statusCode: number;
  statusMessage: string;

  // Methods
  status(code: number): ExpressResponse;
  sendStatus(code: number): void;
  json(body: unknown): void;
  send(body: unknown): void;
  end(data?: unknown): void;
  set(field: string, value: string): ExpressResponse;
  set(field: Record<string, string>): ExpressResponse;
  header(field: string, value: string): ExpressResponse;
  header(field: Record<string, string>): ExpressResponse;
  setHeader(field: string, value: string): ExpressResponse;
  get(field: string): string | null;
  getHeader(field: string): string | null;
  removeHeader(field: string): void;
  append(field: string, value: string | string[]): ExpressResponse;
  type(type: string): ExpressResponse;
  contentType(type: string): ExpressResponse;
  format(obj: Record<string, () => void>): void;
  attachment(filename?: string): ExpressResponse;
  cookie(name: string, value: string, options?: CookieOptions): ExpressResponse;
  clearCookie(name: string, options?: CookieOptions): ExpressResponse;
  redirect(url: string): void;
  redirect(status: number, url: string): void;
  location(url: string): ExpressResponse;
  links(links: Record<string, string>): ExpressResponse;
  vary(field: string): ExpressResponse;

  // Build final response
  _buildResponse(): Response;
}

interface CookieOptions {
  domain?: string;
  encode?: (val: string) => string;
  expires?: Date;
  httpOnly?: boolean;
  maxAge?: number;
  path?: string;
  secure?: boolean;
  signed?: boolean;
  sameSite?: boolean | "lax" | "strict" | "none";
}

/**
 * Create an Express-compatible request object from a Bun Request
 */
export function createExpressRequest(
  bunRequest: Request,
  params: Record<string, string> = {}
): ExpressRequest {
  const url = new URL(bunRequest.url);

  // Parse headers into object
  const headers: Record<string, string | string[] | undefined> = {};
  bunRequest.headers.forEach((value, key) => {
    const existing = headers[key];
    if (existing) {
      headers[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      headers[key] = value;
    }
  });

  // Parse query string
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  // Parse cookies
  const cookies: Record<string, string> = {};
  const cookieHeader = bunRequest.headers.get("cookie");
  if (cookieHeader) {
    cookieHeader.split(";").forEach((cookie) => {
      const [name, ...rest] = cookie.trim().split("=");
      if (name) {
        cookies[name] = rest.join("=");
      }
    });
  }

  // Get IP address
  const ip =
    bunRequest.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    bunRequest.headers.get("x-real-ip") ??
    "127.0.0.1";

  const ips = bunRequest.headers.get("x-forwarded-for")?.split(",").map((s) => s.trim()) ?? [ip];

  // Parse subdomains
  const subdomains = url.hostname.split(".").slice(0, -2).reverse();

  const req: ExpressRequest = {
    raw: bunRequest,
    method: bunRequest.method,
    url: url.pathname + url.search,
    originalUrl: url.pathname + url.search,
    path: url.pathname,
    baseUrl: "",
    hostname: url.hostname,
    ip,
    ips,
    protocol: url.protocol.replace(":", ""),
    secure: url.protocol === "https:",
    subdomains,
    xhr: bunRequest.headers.get("x-requested-with")?.toLowerCase() === "xmlhttprequest",
    params,
    query,
    body: undefined,
    cookies,
    signedCookies: {},
    headers,

    get(field: string): string | undefined {
      const lower = field.toLowerCase();
      const value = bunRequest.headers.get(lower);
      return value ?? undefined;
    },

    header(field: string): string | undefined {
      return this.get(field);
    },

    accepts(...types: string[]): string | false {
      const accept = bunRequest.headers.get("accept") ?? "*/*";
      for (const type of types) {
        if (accept.includes(type) || accept.includes("*/*")) {
          return type;
        }
      }
      return false;
    },

    acceptsCharsets(...charsets: string[]): string | false {
      const accept = bunRequest.headers.get("accept-charset") ?? "*";
      for (const charset of charsets) {
        if (accept.includes(charset) || accept.includes("*")) {
          return charset;
        }
      }
      return false;
    },

    acceptsEncodings(...encodings: string[]): string | false {
      const accept = bunRequest.headers.get("accept-encoding") ?? "*";
      for (const encoding of encodings) {
        if (accept.includes(encoding) || accept.includes("*")) {
          return encoding;
        }
      }
      return false;
    },

    acceptsLanguages(...languages: string[]): string | false {
      const accept = bunRequest.headers.get("accept-language") ?? "*";
      for (const lang of languages) {
        if (accept.includes(lang) || accept.includes("*")) {
          return lang;
        }
      }
      return false;
    },

    is(type: string): string | false | null {
      const contentType = bunRequest.headers.get("content-type");
      if (!contentType) return null;
      return contentType.includes(type) ? type : false;
    },

    range(_size: number, _options?: { combine?: boolean }): number | number[][] | -1 | -2 | undefined {
      const rangeHeader = bunRequest.headers.get("range");
      if (!rangeHeader) return undefined;
      // Simplified range parsing - full implementation would use range-parser
      return undefined;
    },
  };

  return req;
}

/**
 * Create an Express-compatible response object
 */
export function createExpressResponse(): ExpressResponse {
  const headers = new Headers();
  let statusCode = 200;
  let statusMessage = "OK";
  let body: unknown = null;
  let ended = false;
  let headersSent = false;

  const res: ExpressResponse = {
    _headers: headers,
    _statusCode: statusCode,
    _body: body,
    _ended: ended,
    headersSent,
    locals: {},

    get statusCode() {
      return statusCode;
    },
    set statusCode(code: number) {
      statusCode = code;
    },

    get statusMessage() {
      return statusMessage;
    },
    set statusMessage(msg: string) {
      statusMessage = msg;
    },

    status(code: number): ExpressResponse {
      statusCode = code;
      this._statusCode = code;
      return this;
    },

    sendStatus(code: number): void {
      statusCode = code;
      this._statusCode = code;
      body = getStatusText(code);
      this._body = body;
      ended = true;
      this._ended = true;
    },

    json(data: unknown): void {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(data);
      this._body = body;
      ended = true;
      this._ended = true;
    },

    send(data: unknown): void {
      if (typeof data === "string") {
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "text/html");
        }
        body = data;
      } else if (Buffer.isBuffer(data)) {
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "application/octet-stream");
        }
        body = data;
      } else if (typeof data === "object") {
        headers.set("Content-Type", "application/json");
        body = JSON.stringify(data);
      } else {
        body = String(data);
      }
      this._body = body;
      ended = true;
      this._ended = true;
    },

    end(data?: unknown): void {
      if (data !== undefined) {
        body = data;
        this._body = body;
      }
      ended = true;
      this._ended = true;
    },

    set(field: string | Record<string, string>, value?: string): ExpressResponse {
      if (typeof field === "object") {
        for (const [key, val] of Object.entries(field)) {
          headers.set(key, val);
        }
      } else if (value !== undefined) {
        headers.set(field, value);
      }
      return this;
    },

    header(field: string | Record<string, string>, value?: string): ExpressResponse {
      if (typeof field === "object") {
        return this.set(field);
      }
      if (value !== undefined) {
        return this.set(field, value);
      }
      return this;
    },

    setHeader(field: string, value: string): ExpressResponse {
      headers.set(field, value);
      return this;
    },

    get(field: string): string | null {
      return headers.get(field);
    },

    getHeader(field: string): string | null {
      return headers.get(field);
    },

    removeHeader(field: string): void {
      headers.delete(field);
    },

    append(field: string, value: string | string[]): ExpressResponse {
      const values = Array.isArray(value) ? value : [value];
      for (const v of values) {
        headers.append(field, v);
      }
      return this;
    },

    type(type: string): ExpressResponse {
      const mimeType = getMimeType(type);
      headers.set("Content-Type", mimeType);
      return this;
    },

    contentType(type: string): ExpressResponse {
      return this.type(type);
    },

    format(obj: Record<string, () => void>): void {
      // Simplified format implementation
      const defaultFn = obj.default;
      if (defaultFn) {
        defaultFn();
      }
    },

    attachment(filename?: string): ExpressResponse {
      if (filename) {
        headers.set("Content-Disposition", `attachment; filename="${filename}"`);
        const mimeType = getMimeType(filename.split(".").pop() ?? "bin");
        headers.set("Content-Type", mimeType);
      } else {
        headers.set("Content-Disposition", "attachment");
      }
      return this;
    },

    cookie(name: string, value: string, options: CookieOptions = {}): ExpressResponse {
      let cookie = `${name}=${encodeURIComponent(value)}`;

      if (options.maxAge !== undefined) {
        cookie += `; Max-Age=${options.maxAge}`;
      }
      if (options.expires) {
        cookie += `; Expires=${options.expires.toUTCString()}`;
      }
      if (options.path) {
        cookie += `; Path=${options.path}`;
      }
      if (options.domain) {
        cookie += `; Domain=${options.domain}`;
      }
      if (options.secure) {
        cookie += "; Secure";
      }
      if (options.httpOnly) {
        cookie += "; HttpOnly";
      }
      if (options.sameSite) {
        const sameSiteValue = options.sameSite === true ? "Strict" : options.sameSite;
        cookie += `; SameSite=${sameSiteValue.charAt(0).toUpperCase() + sameSiteValue.slice(1)}`;
      }

      headers.append("Set-Cookie", cookie);
      return this;
    },

    clearCookie(name: string, options: CookieOptions = {}): ExpressResponse {
      return this.cookie(name, "", { ...options, expires: new Date(0) });
    },

    redirect(statusOrUrl: number | string, url?: string): void {
      if (typeof statusOrUrl === "number" && url) {
        statusCode = statusOrUrl;
        headers.set("Location", url);
      } else {
        statusCode = 302;
        headers.set("Location", statusOrUrl as string);
      }
      this._statusCode = statusCode;
      ended = true;
      this._ended = true;
    },

    location(url: string): ExpressResponse {
      headers.set("Location", url);
      return this;
    },

    links(links: Record<string, string>): ExpressResponse {
      const linkHeader = Object.entries(links)
        .map(([rel, url]) => `<${url}>; rel="${rel}"`)
        .join(", ");
      headers.set("Link", linkHeader);
      return this;
    },

    vary(field: string): ExpressResponse {
      const existing = headers.get("Vary");
      if (existing) {
        headers.set("Vary", `${existing}, ${field}`);
      } else {
        headers.set("Vary", field);
      }
      return this;
    },

    _buildResponse(): Response {
      headersSent = true;
      this.headersSent = true;

      // Handle redirect
      if (headers.has("Location") && statusCode >= 300 && statusCode < 400) {
        return Response.redirect(headers.get("Location")!, statusCode);
      }

      let responseBody: string | ArrayBuffer | Uint8Array | ReadableStream | Blob | null = null;

      if (body !== null && body !== undefined) {
        if (typeof body === "string" || body instanceof Uint8Array || body instanceof ArrayBuffer) {
          responseBody = body;
        } else if (body instanceof ReadableStream) {
          responseBody = body;
        } else if (body instanceof Blob) {
          responseBody = body;
        } else {
          responseBody = JSON.stringify(body);
        }
      }

      return new Response(responseBody, {
        status: statusCode,
        statusText: statusMessage,
        headers,
      });
    },
  };

  return res;
}

/**
 * Type for Express middleware
 */
export type ExpressMiddleware = (
  req: ExpressRequest,
  res: ExpressResponse,
  next: (err?: unknown) => void
) => void | Promise<void>;

/**
 * Type for Express error middleware
 */
export type ExpressErrorMiddleware = (
  err: unknown,
  req: ExpressRequest,
  res: ExpressResponse,
  next: (err?: unknown) => void
) => void | Promise<void>;

/**
 * Get HTTP status text
 */
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    100: "Continue",
    101: "Switching Protocols",
    200: "OK",
    201: "Created",
    202: "Accepted",
    204: "No Content",
    301: "Moved Permanently",
    302: "Found",
    304: "Not Modified",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    405: "Method Not Allowed",
    409: "Conflict",
    410: "Gone",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    501: "Not Implemented",
    502: "Bad Gateway",
    503: "Service Unavailable",
    504: "Gateway Timeout",
  };
  return statusTexts[status] ?? "Unknown";
}

/**
 * Get MIME type from extension or type name
 */
function getMimeType(type: string): string {
  const mimeTypes: Record<string, string> = {
    html: "text/html",
    htm: "text/html",
    txt: "text/plain",
    text: "text/plain",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    xml: "application/xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    webp: "image/webp",
    ico: "image/x-icon",
    pdf: "application/pdf",
    zip: "application/zip",
    bin: "application/octet-stream",
  };

  // If it looks like a MIME type already, return it
  if (type.includes("/")) {
    return type;
  }

  return mimeTypes[type.toLowerCase()] ?? "application/octet-stream";
}
