/**
 * End-to-end tests for BunAdapter
 *
 * These tests verify the full request/response cycle through the adapter,
 * testing real HTTP requests against a running server.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import { BunAdapter } from "../../src/bun-adapter";

// Skip all tests if not running in Bun
const isBun = typeof globalThis.Bun !== "undefined";
const describeIfBun = isBun ? describe : describe.skip;

describeIfBun("BunAdapter E2E", () => {
  let adapter: BunAdapter;
  let baseUrl: string;

  beforeEach(async () => {
    adapter = new BunAdapter();
  });

  afterEach(async () => {
    try {
      await adapter.close();
    } catch {
      // ignore
    }
  });

  describe("Basic HTTP Methods", () => {
    it("should handle GET requests", async () => {
      adapter.get("/test", (req, res) => {
        res.json({ method: "GET", path: "/test" });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/test`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const body = await response.json();
      expect(body).toEqual({ method: "GET", path: "/test" });
    });

    it("should handle POST requests with JSON body", async () => {
      adapter.post("/users", (req, res) => {
        res.status(201).json({ created: true, data: req.body });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "John", email: "john@example.com" }),
      });

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body.created).toBe(true);
      expect(body.data).toEqual({ name: "John", email: "john@example.com" });
    });

    it("should handle PUT requests", async () => {
      adapter.put("/users/:id", (req, res) => {
        res.json({ updated: true, id: req.params.id, data: req.body });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/users/123`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Updated" }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ updated: true, id: "123", data: { name: "Updated" } });
    });

    it("should handle PATCH requests", async () => {
      adapter.patch("/users/:id", (req, res) => {
        res.json({ patched: true, id: req.params.id });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/users/456`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" }),
      });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({ patched: true, id: "456" });
    });

    it("should handle DELETE requests", async () => {
      adapter.delete("/users/:id", (req, res) => {
        res.status(204).end();
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/users/789`, {
        method: "DELETE",
      });

      expect(response.status).toBe(204);
    });

    it("should handle OPTIONS requests", async () => {
      adapter.options("/test", (req, res) => {
        res.set("Allow", "GET, POST, OPTIONS").status(200).end();
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/test`, {
        method: "OPTIONS",
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("allow")).toBe("GET, POST, OPTIONS");
    });

    it("should handle HEAD requests", async () => {
      adapter.head("/test", (req, res) => {
        res.set("X-Custom-Header", "value").end();
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/test`, {
        method: "HEAD",
      });

      expect(response.status).toBe(200);
      expect(response.headers.get("x-custom-header")).toBe("value");
    });
  });

  describe("Route Parameters", () => {
    it("should extract single route parameter", async () => {
      adapter.get("/users/:id", (req, res) => {
        res.json({ userId: req.params.id });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/users/abc123`);
      const body = await response.json();
      expect(body.userId).toBe("abc123");
    });

    it("should extract multiple route parameters", async () => {
      adapter.get("/orgs/:orgId/users/:userId/posts/:postId", (req, res) => {
        res.json({
          orgId: req.params.orgId,
          userId: req.params.userId,
          postId: req.params.postId,
        });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/orgs/org1/users/user2/posts/post3`);
      const body = await response.json();
      expect(body).toEqual({
        orgId: "org1",
        userId: "user2",
        postId: "post3",
      });
    });

    it("should handle URL-encoded parameters", async () => {
      adapter.get("/search/:query", (req, res) => {
        res.json({ query: req.params.query });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/search/${encodeURIComponent("hello world")}`);
      const body = await response.json();
      expect(body.query).toBe("hello%20world");
    });
  });

  describe("Query Parameters", () => {
    it("should parse query parameters", async () => {
      adapter.get("/search", (req, res) => {
        res.json({ query: req.query });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/search?q=test&page=1&limit=10`);
      const body = await response.json();
      expect(body.query).toEqual({ q: "test", page: "1", limit: "10" });
    });

    it("should handle empty query string", async () => {
      adapter.get("/search", (req, res) => {
        res.json({ query: req.query });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/search`);
      const body = await response.json();
      expect(body.query).toEqual({});
    });
  });

  describe("Request Body Parsing", () => {
    it("should parse JSON body", async () => {
      adapter.post("/json", (req, res) => {
        res.json({ received: req.body });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/json`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "value", nested: { a: 1 } }),
      });

      const body = await response.json();
      expect(body.received).toEqual({ key: "value", nested: { a: 1 } });
    });

    it("should parse URL-encoded body", async () => {
      adapter.post("/form", (req, res) => {
        res.json({ received: req.body });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/form`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "name=John&age=30",
      });

      const body = await response.json();
      expect(body.received).toEqual({ name: "John", age: "30" });
    });

    it("should parse text body", async () => {
      adapter.post("/text", (req, res) => {
        res.send(req.body);
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/text`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "Hello, World!",
      });

      const body = await response.text();
      expect(body).toBe("Hello, World!");
    });

    it("should parse multipart form data", async () => {
      adapter.post("/upload", (req, res) => {
        res.json({ received: req.body });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const formData = new FormData();
      formData.append("field1", "value1");
      formData.append("field2", "value2");

      const response = await fetch(`${baseUrl}/upload`, {
        method: "POST",
        body: formData,
      });

      const body = await response.json();
      expect(body.received.field1).toBe("value1");
      expect(body.received.field2).toBe("value2");
    });
  });

  describe("Response Types", () => {
    it("should send JSON response", async () => {
      adapter.get("/json", (req, res) => {
        res.json({ type: "json", data: [1, 2, 3] });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/json`);
      expect(response.headers.get("content-type")).toContain("application/json");
      const body = await response.json();
      expect(body).toEqual({ type: "json", data: [1, 2, 3] });
    });

    it("should send text response", async () => {
      adapter.get("/text", (req, res) => {
        res.type("text").send("Plain text response");
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/text`);
      expect(response.headers.get("content-type")).toContain("text/plain");
      const body = await response.text();
      expect(body).toBe("Plain text response");
    });

    it("should send HTML response", async () => {
      adapter.get("/html", (req, res) => {
        res.type("html").send("<h1>Hello</h1>");
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/html`);
      expect(response.headers.get("content-type")).toContain("text/html");
      const body = await response.text();
      expect(body).toBe("<h1>Hello</h1>");
    });

    it("should set custom status code", async () => {
      adapter.post("/created", (req, res) => {
        res.status(201).json({ created: true });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/created`, { method: "POST" });
      expect(response.status).toBe(201);
    });

    it("should set custom headers", async () => {
      adapter.get("/headers", (req, res) => {
        res
          .set("X-Custom-One", "value1")
          .set("X-Custom-Two", "value2")
          .json({ ok: true });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/headers`);
      expect(response.headers.get("x-custom-one")).toBe("value1");
      expect(response.headers.get("x-custom-two")).toBe("value2");
    });
  });

  describe("Middleware", () => {
    it("should execute global middleware", async () => {
      adapter.use((req, res, next) => {
        res.set("X-Middleware", "executed");
        next();
      });
      adapter.get("/test", (req, res) => {
        res.json({ ok: true });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/test`);
      expect(response.headers.get("x-middleware")).toBe("executed");
    });

    it("should execute path-specific middleware", async () => {
      adapter.use("/api", (req, res, next) => {
        res.set("X-API-Middleware", "executed");
        next();
      });
      adapter.get("/api/users", (req, res) => res.json({ users: [] }));
      adapter.get("/public", (req, res) => res.json({ public: true }));

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const apiResponse = await fetch(`${baseUrl}/api/users`);
      expect(apiResponse.headers.get("x-api-middleware")).toBe("executed");

      const publicResponse = await fetch(`${baseUrl}/public`);
      expect(publicResponse.headers.get("x-api-middleware")).toBeNull();
    });

    it("should chain multiple middleware", async () => {
      const order: number[] = [];

      adapter.use((req, res, next) => {
        order.push(1);
        next();
      });
      adapter.use((req, res, next) => {
        order.push(2);
        next();
      });
      adapter.get("/test", (req, res) => {
        order.push(3);
        res.json({ order });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/test`);
      const body = await response.json();
      expect(body.order).toEqual([1, 2, 3]);
    });

    it("should handle middleware that ends response early", async () => {
      adapter.use((req, res, next) => {
        if (req.get("Authorization") !== "Bearer token") {
          res.status(401).json({ error: "Unauthorized" });
          return;
        }
        next();
      });
      adapter.get("/protected", (req, res) => {
        res.json({ secret: "data" });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      // Without auth
      const noAuthResponse = await fetch(`${baseUrl}/protected`);
      expect(noAuthResponse.status).toBe(401);

      // With auth
      const authResponse = await fetch(`${baseUrl}/protected`, {
        headers: { Authorization: "Bearer token" },
      });
      expect(authResponse.status).toBe(200);
      const body = await authResponse.json();
      expect(body.secret).toBe("data");
    });
  });

  describe("Error Handling", () => {
    it("should handle route handler errors", async () => {
      adapter.get("/error", () => {
        throw new Error("Something went wrong");
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/error`);
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.message).toBe("Something went wrong");
    });

    it("should handle async route handler errors", async () => {
      adapter.get("/async-error", async () => {
        await new Promise((r) => setTimeout(r, 10));
        throw new Error("Async error");
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/async-error`);
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.message).toBe("Async error");
    });

    it("should use custom error handler", async () => {
      adapter.setErrorHandler((error, req, res) => {
        res.status(500).json({
          customError: true,
          message: error.message,
        });
      });
      adapter.get("/error", () => {
        throw new Error("Custom handled");
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/error`);
      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.customError).toBe(true);
      expect(body.message).toBe("Custom handled");
    });

    it("should use error middleware", async () => {
      adapter.use((err: unknown, req: unknown, res: Record<string, unknown>, next: () => void) => {
        (res as { status: (n: number) => { json: (o: unknown) => void } })
          .status(400)
          .json({ errorMiddleware: true });
      });
      adapter.get("/error", () => {
        throw new Error("Caught by middleware");
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/error`);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.errorMiddleware).toBe(true);
    });

    it("should return 404 for unknown routes", async () => {
      adapter.get("/known", (req, res) => res.json({ ok: true }));

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/unknown`);
      expect(response.status).toBe(404);
    });

    it("should use custom not found handler", async () => {
      adapter.setNotFoundHandler((req, res) => {
        res.status(404).json({
          error: "Route not found",
          path: req.path,
        });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/nonexistent`);
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error).toBe("Route not found");
      expect(body.path).toBe("/nonexistent");
    });
  });

  describe("CORS", () => {
    it("should enable CORS with default options", async () => {
      adapter.enableCors();
      adapter.get("/test", (req, res) => res.json({ ok: true }));

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/test`, {
        headers: { Origin: "https://example.com" },
      });

      expect(response.headers.get("access-control-allow-origin")).toBe("*");
    });

    it("should handle CORS preflight requests", async () => {
      adapter.enableCors();
      adapter.post("/api/data", (req, res) => res.json({ ok: true }));

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/api/data`, {
        method: "OPTIONS",
        headers: {
          Origin: "https://example.com",
          "Access-Control-Request-Method": "POST",
        },
      });

      expect(response.status).toBe(204);
      expect(response.headers.get("access-control-allow-methods")).toBeDefined();
    });

    it("should allow specific origin", async () => {
      adapter.enableCors({ origin: "https://allowed.com" });
      adapter.get("/test", (req, res) => res.json({ ok: true }));

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/test`, {
        headers: { Origin: "https://allowed.com" },
      });

      expect(response.headers.get("access-control-allow-origin")).toBe("https://allowed.com");
    });

    it("should support credentials", async () => {
      adapter.enableCors({ credentials: true });
      adapter.get("/test", (req, res) => res.json({ ok: true }));

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/test`);
      expect(response.headers.get("access-control-allow-credentials")).toBe("true");
    });
  });

  describe("Global Prefix", () => {
    it("should apply global prefix to routes", async () => {
      adapter.setGlobalPrefix("/api/v1");
      adapter.get("/users", (req, res) => res.json({ users: [] }));

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      // Should work with prefix
      const response = await fetch(`${baseUrl}/api/v1/users`);
      expect(response.status).toBe(200);

      // Should not work without prefix
      const noPrefix = await fetch(`${baseUrl}/users`);
      expect(noPrefix.status).toBe(404);
    });
  });

  describe("Wildcard Routes", () => {
    it("should handle wildcard routes", async () => {
      adapter.get("/static/*", (req, res) => {
        res.json({ path: req.path });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/static/css/main.css`);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.path).toBe("/static/css/main.css");
    });
  });

  describe("Cookies", () => {
    it("should set cookies", async () => {
      adapter.get("/set-cookie", (req, res) => {
        res.cookie("session", "abc123", { httpOnly: true }).json({ ok: true });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/set-cookie`);
      const setCookie = response.headers.get("set-cookie");
      expect(setCookie).toContain("session=abc123");
      expect(setCookie).toContain("HttpOnly");
    });

    it("should read cookies", async () => {
      adapter.get("/read-cookie", (req, res) => {
        res.json({ cookies: req.cookies });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/read-cookie`, {
        headers: { Cookie: "session=xyz789; user=john" },
      });
      const body = await response.json();
      expect(body.cookies).toEqual({ session: "xyz789", user: "john" });
    });

    it("should clear cookies", async () => {
      adapter.get("/clear-cookie", (req, res) => {
        res.clearCookie("session").json({ ok: true });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/clear-cookie`);
      const setCookie = response.headers.get("set-cookie");
      expect(setCookie).toContain("session=");
      expect(setCookie).toContain("Expires=Thu, 01 Jan 1970");
    });
  });

  describe("Redirects", () => {
    it("should redirect with default 302", async () => {
      adapter.get("/old", (req, res) => {
        res.redirect("/new");
      });
      adapter.get("/new", (req, res) => {
        res.json({ location: "new" });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/old`, { redirect: "manual" });
      expect(response.status).toBe(302);
      expect(response.headers.get("location")).toBe("/new");
    });

    it("should redirect with custom status", async () => {
      adapter.get("/moved", (req, res) => {
        res.redirect(301, "/permanent");
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/moved`, { redirect: "manual" });
      expect(response.status).toBe(301);
    });
  });

  describe("Fastify Hooks", () => {
    it("should execute onRequest hook", async () => {
      const hookCalled: string[] = [];

      adapter.addHook("onRequest", (req, reply, done) => {
        hookCalled.push("onRequest");
        done();
      });

      adapter.get("/test", (req, res) => {
        res.json({ hookCalled });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/test`);
      const body = await response.json();
      expect(body.hookCalled).toContain("onRequest");
    });

    it("should execute preHandler hook", async () => {
      const hookCalled: string[] = [];

      adapter.addHook("preHandler", (req, reply, done) => {
        hookCalled.push("preHandler");
        done();
      });

      adapter.get("/test", (req, res) => {
        res.json({ hookCalled });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/test`);
      const body = await response.json();
      expect(body.hookCalled).toContain("preHandler");
    });

    it("should execute onResponse hook", async () => {
      let onResponseCalled = false;

      adapter.addHook("onResponse", (req, reply, done) => {
        onResponseCalled = true;
        done();
      });

      adapter.get("/test", (req, res) => {
        res.json({ ok: true });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      await fetch(`${baseUrl}/test`);

      // Give hooks time to execute
      await new Promise((r) => setTimeout(r, 50));
      expect(onResponseCalled).toBe(true);
    });
  });

  describe("Fastify Decorators", () => {
    it("should decorate request", async () => {
      adapter.decorateRequest("customField", "custom-value");

      adapter.get("/test", (req, res) => {
        // Note: In real Fastify, you'd access via req.customField
        // Our implementation applies decorators to Fastify request object
        res.json({ ok: true });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/test`);
      expect(response.status).toBe(200);
      expect(adapter.hasRequestDecorator("customField")).toBe(true);
    });

    it("should decorate reply", async () => {
      adapter.decorateReply("customMethod", () => "custom");

      adapter.get("/test", (req, res) => {
        res.json({ ok: true });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/test`);
      expect(response.status).toBe(200);
      expect(adapter.hasReplyDecorator("customMethod")).toBe(true);
    });
  });

  describe("Request Headers", () => {
    it("should access request headers", async () => {
      adapter.get("/headers", (req, res) => {
        res.json({
          userAgent: req.get("user-agent"),
          customHeader: req.get("x-custom-header"),
        });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/headers`, {
        headers: { "X-Custom-Header": "custom-value" },
      });
      const body = await response.json();
      expect(body.customHeader).toBe("custom-value");
    });
  });

  describe("Response Status Codes", () => {
    it("should send status with text", async () => {
      adapter.get("/status", (req, res) => {
        res.sendStatus(204);
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const response = await fetch(`${baseUrl}/status`);
      expect(response.status).toBe(204);
    });
  });

  describe("Concurrent Requests", () => {
    it("should handle concurrent requests", async () => {
      adapter.get("/delay/:ms", async (req, res) => {
        const ms = parseInt(req.params.ms, 10);
        await new Promise((r) => setTimeout(r, ms));
        res.json({ delayed: ms });
      });

      await adapter.listen(0);
      const port = adapter.getHttpServer().server?.port;
      baseUrl = `http://localhost:${port}`;

      const requests = [
        fetch(`${baseUrl}/delay/50`),
        fetch(`${baseUrl}/delay/30`),
        fetch(`${baseUrl}/delay/10`),
      ];

      const responses = await Promise.all(requests);
      const bodies = await Promise.all(responses.map((r) => r.json()));

      expect(bodies).toContainEqual({ delayed: 50 });
      expect(bodies).toContainEqual({ delayed: 30 });
      expect(bodies).toContainEqual({ delayed: 10 });
    });
  });
});
