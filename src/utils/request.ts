/**
 * Extended request interface with parsed data
 */
export interface ParsedRequest extends Request {
  params: Record<string, string>;
  query: Record<string, string>;
  parsedBody?: unknown;
}

/**
 * Parse query parameters from a URL
 */
export function parseQueryParams(url: URL): Record<string, string> {
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return query;
}

/**
 * Parse the request body based on content type
 */
export async function parseBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await request.json();
    } catch {
      return null;
    }
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    try {
      const text = await request.text();
      const params = new URLSearchParams(text);
      const body: Record<string, string> = {};
      params.forEach((value, key) => {
        body[key] = value;
      });
      return body;
    } catch {
      return null;
    }
  }

  if (contentType.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const body: Record<string, unknown> = {};
      formData.forEach((value, key) => {
        body[key] = value;
      });
      return body;
    } catch {
      return null;
    }
  }

  if (contentType.includes("text/")) {
    try {
      return await request.text();
    } catch {
      return null;
    }
  }

  // Return raw array buffer for binary data
  try {
    return await request.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * Create an enhanced request object with parsed data
 */
export async function enhanceRequest(
  request: Request,
  params: Record<string, string> = {}
): Promise<ParsedRequest> {
  const url = new URL(request.url);
  const query = parseQueryParams(url);
  const parsedBody = await parseBody(request);

  // Create a new request-like object with additional properties
  const enhanced = request as ParsedRequest;
  enhanced.params = params;
  enhanced.query = query;
  enhanced.parsedBody = parsedBody;

  return enhanced;
}

/**
 * Get a header value from the request (case-insensitive)
 */
export function getHeader(request: Request, name: string): string | null {
  return request.headers.get(name);
}

/**
 * Check if the request accepts a specific content type
 */
export function accepts(request: Request, type: string): boolean {
  const accept = request.headers.get("accept") ?? "*/*";
  return accept.includes(type) || accept.includes("*/*");
}

/**
 * Get the IP address from the request
 */
export function getIp(request: Request): string | null {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    null
  );
}
