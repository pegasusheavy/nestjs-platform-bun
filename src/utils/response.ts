type ResponseBody = string | ArrayBuffer | Uint8Array | ReadableStream | Blob | null;

/**
 * Response builder for creating Bun-compatible Response objects
 */
export class ResponseBuilder {
  private _status: number = 200;
  private _headers: Headers = new Headers();
  private _body: ResponseBody = null;

  /**
   * Set the status code
   */
  public status(code: number): this {
    this._status = code;
    return this;
  }

  /**
   * Set a header
   */
  public header(name: string, value: string): this {
    this._headers.set(name, value);
    return this;
  }

  /**
   * Set multiple headers
   */
  public headers(headers: Record<string, string>): this {
    for (const [name, value] of Object.entries(headers)) {
      this._headers.set(name, value);
    }
    return this;
  }

  /**
   * Set JSON body
   */
  public json(data: unknown): Response {
    this._headers.set("Content-Type", "application/json");
    this._body = JSON.stringify(data);
    return this.build();
  }

  /**
   * Set text body
   */
  public text(data: string): Response {
    if (!this._headers.has("Content-Type")) {
      this._headers.set("Content-Type", "text/plain");
    }
    this._body = data;
    return this.build();
  }

  /**
   * Set HTML body
   */
  public html(data: string): Response {
    this._headers.set("Content-Type", "text/html");
    this._body = data;
    return this.build();
  }

  /**
   * Set binary body
   */
  public binary(data: ArrayBuffer | Uint8Array): Response {
    if (!this._headers.has("Content-Type")) {
      this._headers.set("Content-Type", "application/octet-stream");
    }
    this._body = data;
    return this.build();
  }

  /**
   * Set stream body
   */
  public stream(data: ReadableStream): Response {
    this._body = data;
    return this.build();
  }

  /**
   * Send file as response
   */
  public async file(path: string): Promise<Response> {
    const file = Bun.file(path);
    if (!(await file.exists())) {
      return new Response("Not Found", { status: 404 });
    }

    const mimeType = file.type;
    this._headers.set("Content-Type", mimeType);
    this._body = file;
    return this.build();
  }

  /**
   * Create a redirect response
   */
  public redirect(url: string, status: number = 302): Response {
    return Response.redirect(url, status);
  }

  /**
   * Build the final Response object
   */
  public build(): Response {
    return new Response(this._body, {
      status: this._status,
      headers: this._headers,
    });
  }
}

/**
 * Create a new response builder
 */
export function response(): ResponseBuilder {
  return new ResponseBuilder();
}

/**
 * Quick JSON response
 */
export function json(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Quick text response
 */
export function text(data: string, status: number = 200): Response {
  return new Response(data, {
    status,
    headers: { "Content-Type": "text/plain" },
  });
}

/**
 * Quick HTML response
 */
export function html(data: string, status: number = 200): Response {
  return new Response(data, {
    status,
    headers: { "Content-Type": "text/html" },
  });
}

/**
 * Quick error response
 */
export function error(message: string, statusCode: number = 500): Response {
  return json({ statusCode, message, error: getStatusText(statusCode) }, statusCode);
}

/**
 * Get HTTP status text for a status code
 */
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: "OK",
    201: "Created",
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
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
  };
  return statusTexts[status] ?? "Unknown";
}
