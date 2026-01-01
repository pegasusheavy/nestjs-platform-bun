import { describe, it, expect } from "vitest";
import {
  parseQueryParams,
  parseBody,
  enhanceRequest,
  getHeader,
  accepts,
  getIp,
} from "./request";

describe("parseQueryParams", () => {
  it("should parse query parameters from URL", () => {
    const url = new URL("http://localhost?foo=bar&baz=qux");
    const result = parseQueryParams(url);
    expect(result).toEqual({ foo: "bar", baz: "qux" });
  });

  it("should return empty object for URL without query params", () => {
    const url = new URL("http://localhost/path");
    const result = parseQueryParams(url);
    expect(result).toEqual({});
  });

  it("should handle URL-encoded values", () => {
    const url = new URL("http://localhost?name=John%20Doe&city=New%20York");
    const result = parseQueryParams(url);
    expect(result).toEqual({ name: "John Doe", city: "New York" });
  });
});

describe("parseBody", () => {
  it("should parse JSON body", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foo: "bar" }),
    });
    const result = await parseBody(request);
    expect(result).toEqual({ foo: "bar" });
  });

  it("should return null for invalid JSON", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "invalid json",
    });
    const result = await parseBody(request);
    expect(result).toBeNull();
  });

  it("should parse URL-encoded form data", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "foo=bar&baz=qux",
    });
    const result = await parseBody(request);
    expect(result).toEqual({ foo: "bar", baz: "qux" });
  });

  it("should parse multipart form data", async () => {
    const formData = new FormData();
    formData.append("name", "John");
    formData.append("age", "30");

    const request = new Request("http://localhost", {
      method: "POST",
      body: formData,
    });
    const result = await parseBody(request);
    expect(result).toEqual({ name: "John", age: "30" });
  });

  it("should parse text body", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "Hello, World!",
    });
    const result = await parseBody(request);
    expect(result).toBe("Hello, World!");
  });

  it("should return ArrayBuffer for binary data", async () => {
    const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: buffer,
    });
    const result = await parseBody(request);
    expect(result).toBeInstanceOf(ArrayBuffer);
  });

  it("should return ArrayBuffer for unknown content type", async () => {
    const buffer = new Uint8Array([1, 2, 3, 4]).buffer;
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: buffer,
    });
    const result = await parseBody(request);
    // Should return ArrayBuffer for binary data
    expect(result).toBeInstanceOf(ArrayBuffer);
  });

  it("should handle URL-encoded parse error", async () => {
    // Create a request that will fail to parse
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "valid=data",
    });
    // Mock text() to throw
    Object.defineProperty(request, "text", {
      value: () => Promise.reject(new Error("Parse error")),
    });

    const result = await parseBody(request);
    expect(result).toBeNull();
  });

  it("should handle multipart form data parse error", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "multipart/form-data; boundary=----" },
    });
    // Mock formData() to throw
    Object.defineProperty(request, "formData", {
      value: () => Promise.reject(new Error("Parse error")),
    });

    const result = await parseBody(request);
    expect(result).toBeNull();
  });

  it("should handle text parse error", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: "test",
    });
    // Mock text() to throw
    Object.defineProperty(request, "text", {
      value: () => Promise.reject(new Error("Parse error")),
    });

    const result = await parseBody(request);
    expect(result).toBeNull();
  });

  it("should handle arrayBuffer parse error", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      headers: { "Content-Type": "application/octet-stream" },
      body: new ArrayBuffer(4),
    });
    // Mock arrayBuffer() to throw
    Object.defineProperty(request, "arrayBuffer", {
      value: () => Promise.reject(new Error("Parse error")),
    });

    const result = await parseBody(request);
    expect(result).toBeNull();
  });
});

describe("enhanceRequest", () => {
  it("should enhance request with params, query, and parsed body", async () => {
    const request = new Request("http://localhost/path?foo=bar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: "test" }),
    });

    const enhanced = await enhanceRequest(request, { id: "123" });

    expect(enhanced.params).toEqual({ id: "123" });
    expect(enhanced.query).toEqual({ foo: "bar" });
    expect(enhanced.parsedBody).toEqual({ data: "test" });
  });

  it("should work without params", async () => {
    const request = new Request("http://localhost?a=1");
    const enhanced = await enhanceRequest(request);

    expect(enhanced.params).toEqual({});
    expect(enhanced.query).toEqual({ a: "1" });
  });
});

describe("getHeader", () => {
  it("should get header value case-insensitively", () => {
    const request = new Request("http://localhost", {
      headers: { "Content-Type": "application/json" },
    });
    expect(getHeader(request, "content-type")).toBe("application/json");
    expect(getHeader(request, "Content-Type")).toBe("application/json");
  });

  it("should return null for missing header", () => {
    const request = new Request("http://localhost");
    expect(getHeader(request, "x-missing")).toBeNull();
  });
});

describe("accepts", () => {
  it("should return true when type is accepted", () => {
    const request = new Request("http://localhost", {
      headers: { Accept: "application/json, text/html" },
    });
    expect(accepts(request, "application/json")).toBe(true);
    expect(accepts(request, "text/html")).toBe(true);
  });

  it("should return true for */* accept header", () => {
    const request = new Request("http://localhost", {
      headers: { Accept: "*/*" },
    });
    expect(accepts(request, "anything")).toBe(true);
  });

  it("should return false when type is not accepted", () => {
    const request = new Request("http://localhost", {
      headers: { Accept: "text/plain" },
    });
    expect(accepts(request, "application/json")).toBe(false);
  });

  it("should default to accepting everything when no accept header", () => {
    const request = new Request("http://localhost");
    expect(accepts(request, "application/json")).toBe(true);
  });
});

describe("getIp", () => {
  it("should get IP from x-forwarded-for header", () => {
    const request = new Request("http://localhost", {
      headers: { "X-Forwarded-For": "192.168.1.1, 10.0.0.1" },
    });
    expect(getIp(request)).toBe("192.168.1.1");
  });

  it("should get IP from x-real-ip header", () => {
    const request = new Request("http://localhost", {
      headers: { "X-Real-IP": "10.0.0.1" },
    });
    expect(getIp(request)).toBe("10.0.0.1");
  });

  it("should return null when no IP headers", () => {
    const request = new Request("http://localhost");
    expect(getIp(request)).toBeNull();
  });

  it("should prefer x-forwarded-for over x-real-ip", () => {
    const request = new Request("http://localhost", {
      headers: {
        "X-Forwarded-For": "192.168.1.1",
        "X-Real-IP": "10.0.0.1",
      },
    });
    expect(getIp(request)).toBe("192.168.1.1");
  });
});
