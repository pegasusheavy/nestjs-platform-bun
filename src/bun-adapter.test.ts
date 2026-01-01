import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BunAdapter } from "./bun-adapter";

describe("BunAdapter", () => {
  let adapter: BunAdapter;

  beforeEach(() => {
    adapter = new BunAdapter();
  });

  afterEach(async () => {
    try {
      await adapter.close();
    } catch {
      // ignore
    }
  });

  describe("constructor", () => {
    it("should create adapter without server instance", () => {
      const adapter = new BunAdapter();
      expect(adapter).toBeInstanceOf(BunAdapter);
      expect(adapter.getInstance()).toBeDefined();
    });
  });

  describe("HTTP method registration", () => {
    it("should register GET route with path", async () => {
      const handler = vi.fn((req, res) => res.send("ok"));
      adapter.get("/test", handler);

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);
      expect(response.status).toBe(200);
    });

    it("should register GET route without path", async () => {
      const handler = vi.fn((req, res) => res.send("ok"));
      adapter.get(handler);

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/`);
      expect(response.status).toBe(200);
    });

    it("should register POST route", async () => {
      adapter.post("/test", (req, res) => res.send("posted"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`, { method: "POST" });
      expect(response.status).toBe(200);
    });

    it("should register POST route without path", async () => {
      adapter.post((req, res) => res.send("posted"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/`, { method: "POST" });
      expect(response.status).toBe(200);
    });

    it("should register PUT route", async () => {
      adapter.put("/test", (req, res) => res.send("put"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`, { method: "PUT" });
      expect(response.status).toBe(200);
    });

    it("should register PUT route without path", async () => {
      adapter.put((req, res) => res.send("put"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/`, { method: "PUT" });
      expect(response.status).toBe(200);
    });

    it("should register DELETE route", async () => {
      adapter.delete("/test", (req, res) => res.send("deleted"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`, { method: "DELETE" });
      expect(response.status).toBe(200);
    });

    it("should register DELETE route without path", async () => {
      adapter.delete((req, res) => res.send("deleted"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/`, { method: "DELETE" });
      expect(response.status).toBe(200);
    });

    it("should register PATCH route", async () => {
      adapter.patch("/test", (req, res) => res.send("patched"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`, { method: "PATCH" });
      expect(response.status).toBe(200);
    });

    it("should register PATCH route without path", async () => {
      adapter.patch((req, res) => res.send("patched"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/`, { method: "PATCH" });
      expect(response.status).toBe(200);
    });

    it("should register OPTIONS route", async () => {
      adapter.options("/test", (req, res) => res.send("options"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`, { method: "OPTIONS" });
      expect(response.status).toBe(200);
    });

    it("should register OPTIONS route without path", async () => {
      adapter.options((req, res) => res.send("options"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/`, { method: "OPTIONS" });
      expect(response.status).toBe(200);
    });

    it("should register HEAD route", async () => {
      adapter.head("/test", (req, res) => res.end());

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`, { method: "HEAD" });
      expect(response.status).toBe(200);
    });

    it("should register HEAD route without path", async () => {
      adapter.head((req, res) => res.end());

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/`, { method: "HEAD" });
      expect(response.status).toBe(200);
    });

    it("should register ALL route", async () => {
      adapter.all("/test", (req, res) => res.send("all"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;

      const getResponse = await fetch(`http://localhost:${server?.port}/test`);
      expect(getResponse.status).toBe(200);

      const postResponse = await fetch(`http://localhost:${server?.port}/test`, { method: "POST" });
      expect(postResponse.status).toBe(200);
    });

    it("should register ALL route without path", async () => {
      adapter.all((req, res) => res.send("all"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/`);
      expect(response.status).toBe(200);
    });
  });

  describe("route parameters", () => {
    it("should extract route parameters", async () => {
      adapter.get("/users/:id", (req, res) => {
        res.json({ id: req.params.id });
      });

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/users/123`);
      const body = await response.json();
      expect(body.id).toBe("123");
    });

    it("should handle multiple parameters", async () => {
      adapter.get("/users/:userId/posts/:postId", (req, res) => {
        res.json({ userId: req.params.userId, postId: req.params.postId });
      });

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/users/1/posts/2`);
      const body = await response.json();
      expect(body).toEqual({ userId: "1", postId: "2" });
    });
  });

  describe("wildcard routes", () => {
    it("should handle wildcard routes", async () => {
      adapter.get("/files/*", (req, res) => res.send("file"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/files/path/to/file.txt`);
      expect(response.status).toBe(200);
    });
  });

  describe("global prefix", () => {
    it("should apply global prefix to routes", async () => {
      adapter.setGlobalPrefix("/api");
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/api/test`);
      expect(response.status).toBe(200);
    });

    it("should handle prefix without leading slash", async () => {
      adapter.setGlobalPrefix("api");
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/api/test`);
      expect(response.status).toBe(200);
    });
  });

  describe("request body parsing", () => {
    it("should parse JSON body", async () => {
      adapter.post("/test", (req, res) => {
        res.json(req.body);
      });

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ foo: "bar" }),
      });
      const body = await response.json();
      expect(body).toEqual({ foo: "bar" });
    });

    it("should parse URL-encoded body", async () => {
      adapter.post("/test", (req, res) => {
        res.json(req.body);
      });

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "foo=bar&baz=qux",
      });
      const body = await response.json();
      expect(body).toEqual({ foo: "bar", baz: "qux" });
    });

    it("should parse text body", async () => {
      adapter.post("/test", (req, res) => {
        res.send(req.body);
      });

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "Hello, World!",
      });
      const body = await response.text();
      expect(body).toBe("Hello, World!");
    });

    it("should handle multipart form data", async () => {
      adapter.post("/test", (req, res) => {
        res.json(req.body);
      });

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;

      const formData = new FormData();
      formData.append("name", "John");

      const response = await fetch(`http://localhost:${server?.port}/test`, {
        method: "POST",
        body: formData,
      });
      const body = await response.json();
      expect(body.name).toBe("John");
    });
  });

  describe("middleware", () => {
    it("should execute global middleware", async () => {
      const middlewareSpy = vi.fn((req, res, next) => {
        req.customData = "test";
        next();
      });

      adapter.use(middlewareSpy);
      adapter.get("/test", (req, res) => {
        res.send((req as Record<string, unknown>).customData);
      });

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);
      const body = await response.text();

      expect(middlewareSpy).toHaveBeenCalled();
      expect(body).toBe("test");
    });

    it("should execute path-specific middleware", async () => {
      const middlewareSpy = vi.fn((req, res, next) => next());

      adapter.use("/api", middlewareSpy);
      adapter.get("/api/test", (req, res) => res.send("ok"));
      adapter.get("/other", (req, res) => res.send("other"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;

      await fetch(`http://localhost:${server?.port}/api/test`);
      expect(middlewareSpy).toHaveBeenCalledTimes(1);

      await fetch(`http://localhost:${server?.port}/other`);
      expect(middlewareSpy).toHaveBeenCalledTimes(1); // Not called again
    });

    it("should handle middleware that ends response", async () => {
      adapter.use((req, res, next) => {
        res.status(401).send("Unauthorized");
      });
      adapter.get("/test", (req, res) => res.send("should not reach"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.status).toBe(401);
      expect(await response.text()).toBe("Unauthorized");
    });

    it("should handle error middleware", async () => {
      adapter.use((req, res, next) => {
        next(new Error("Test error"));
      });
      adapter.use((err: unknown, req: unknown, res: Record<string, unknown>, next: () => void) => {
        (res as { status: (code: number) => { send: (body: string) => void } })
          .status(500)
          .send("Error handled");
      });
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.status).toBe(500);
      expect(await response.text()).toBe("Error handled");
    });

    it("should handle array of middleware", async () => {
      const middleware1 = vi.fn((req, res, next) => next());
      const middleware2 = vi.fn((req, res, next) => next());

      adapter.use([middleware1, middleware2]);
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      await fetch(`http://localhost:${server?.port}/test`);

      expect(middleware1).toHaveBeenCalled();
      expect(middleware2).toHaveBeenCalled();
    });

    it("should handle multiple middleware in use call", async () => {
      const middleware1 = vi.fn((req, res, next) => next());
      const middleware2 = vi.fn((req, res, next) => next());

      adapter.use(middleware1, middleware2);
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      await fetch(`http://localhost:${server?.port}/test`);

      expect(middleware1).toHaveBeenCalled();
      expect(middleware2).toHaveBeenCalled();
    });

    it("should handle path-specific multiple middleware", async () => {
      const middleware1 = vi.fn((req, res, next) => next());
      const middleware2 = vi.fn((req, res, next) => next());

      adapter.use("/api", middleware1, middleware2);
      adapter.get("/api/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      await fetch(`http://localhost:${server?.port}/api/test`);

      expect(middleware1).toHaveBeenCalled();
      expect(middleware2).toHaveBeenCalled();
    });
  });

  describe("CORS", () => {
    it("should enable CORS with default options", async () => {
      adapter.enableCors();
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("should enable CORS with custom origin", async () => {
      adapter.enableCors({ origin: "https://example.com" });
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
    });

    it("should handle CORS with origin array", async () => {
      adapter.enableCors({
        origin: ["https://example.com", "https://other.com"],
      });
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`, {
        headers: { Origin: "https://example.com" },
      });

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
    });

    it("should handle CORS with boolean origin", async () => {
      adapter.enableCors({ origin: true });
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`, {
        headers: { Origin: "https://example.com" },
      });

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
    });

    it("should handle CORS with origin function", async () => {
      adapter.enableCors({
        origin: (origin, callback) => callback(null, true),
      });
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`, {
        headers: { Origin: "https://example.com" },
      });

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("https://example.com");
    });

    it("should handle CORS preflight", async () => {
      adapter.enableCors();
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`, {
        method: "OPTIONS",
      });

      expect(response.status).toBe(204);
    });

    it("should handle CORS preflight with continue", async () => {
      adapter.enableCors({ preflightContinue: true });
      adapter.options("/test", (req, res) => res.send("options handled"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`, {
        method: "OPTIONS",
      });

      expect(await response.text()).toBe("options handled");
    });

    it("should set credentials header when enabled", async () => {
      adapter.enableCors({ credentials: true });
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.headers.get("Access-Control-Allow-Credentials")).toBe("true");
    });

    it("should handle exposed headers", async () => {
      adapter.enableCors({ exposedHeaders: ["X-Custom"] });
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.headers.get("Access-Control-Expose-Headers")).toBe("X-Custom");
    });

    it("should handle methods array", async () => {
      adapter.enableCors({ methods: ["GET", "POST"] });
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.headers.get("Access-Control-Allow-Methods")).toBe("GET,POST");
    });

    it("should handle allowed headers array", async () => {
      adapter.enableCors({ allowedHeaders: ["Content-Type", "Authorization"] });
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type,Authorization");
    });

    it("should handle exposed headers array", async () => {
      adapter.enableCors({ exposedHeaders: ["X-One", "X-Two"] });
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.headers.get("Access-Control-Expose-Headers")).toBe("X-One,X-Two");
    });
  });

  describe("Fastify compatibility", () => {
    it("should add hooks", async () => {
      const hookSpy = vi.fn((req, reply, done) => done());
      adapter.addHook("onRequest", hookSpy);
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      await fetch(`http://localhost:${server?.port}/test`);

      expect(hookSpy).toHaveBeenCalled();
    });

    it("should register plugins", async () => {
      const pluginSpy = vi.fn((instance, opts, done) => done());
      adapter.register(pluginSpy, { option: "value" });
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      await fetch(`http://localhost:${server?.port}/test`);

      expect(pluginSpy).toHaveBeenCalled();
    });

    it("should decorate instance", () => {
      adapter.decorate("myValue", 123);
      expect(adapter.hasDecorator("myValue")).toBe(true);
    });

    it("should decorate request", () => {
      adapter.decorateRequest("user", null);
      expect(adapter.hasRequestDecorator("user")).toBe(true);
    });

    it("should decorate reply", () => {
      adapter.decorateReply("timing", null);
      expect(adapter.hasReplyDecorator("timing")).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle route handler errors", async () => {
      adapter.get("/test", () => {
        throw new Error("Test error");
      });

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.status).toBe(500);
    });

    it("should use custom error handler", async () => {
      adapter.setErrorHandler((error, req, res) => {
        res.status(503).send("Custom error");
      });
      adapter.get("/test", () => {
        throw new Error("Test error");
      });

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.status).toBe(503);
      expect(await response.text()).toBe("Custom error");
    });

    it("should use custom not found handler", async () => {
      adapter.setNotFoundHandler((req, res) => {
        res.status(404).send("Custom not found");
      });

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/nonexistent`);

      expect(response.status).toBe(404);
      expect(await response.text()).toBe("Custom not found");
    });

    it("should return 404 for unmatched routes", async () => {
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/nonexistent`);

      expect(response.status).toBe(404);
    });

    it("should handle middleware throwing error", async () => {
      adapter.use(() => {
        throw new Error("Middleware error");
      });
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.status).toBe(500);
    });
  });

  describe("listen", () => {
    it("should listen on port with callback", async () => {
      const callback = vi.fn();
      await adapter.listen(0, callback);

      expect(callback).toHaveBeenCalled();
    });

    it("should listen on port and hostname", async () => {
      await adapter.listen(0, "127.0.0.1");
      const server = adapter.getHttpServer();
      const address = server.address();

      expect(address?.address).toBe("127.0.0.1");
    });

    it("should listen on port and hostname with callback", async () => {
      const callback = vi.fn();
      await adapter.listen(0, "127.0.0.1", callback);

      expect(callback).toHaveBeenCalled();
    });

    it("should listen on string port", async () => {
      await adapter.listen("0");
      const server = adapter.getHttpServer().server;
      expect(server?.port).toBeDefined();
    });
  });

  describe("close", () => {
    it("should close the server", async () => {
      await adapter.listen(0);
      const server = adapter.getHttpServer();
      expect(server.listening).toBe(true);

      await adapter.close();
      expect(server.listening).toBe(false);
    });
  });

  describe("getHttpServer", () => {
    it("should return the server wrapper", () => {
      const server = adapter.getHttpServer();
      expect(server).toBeDefined();
    });
  });

  describe("getInstance", () => {
    it("should return the instance", () => {
      const instance = adapter.getInstance();
      expect(instance).toBeDefined();
    });
  });

  describe("getType", () => {
    it("should return 'bun'", () => {
      expect(adapter.getType()).toBe("bun");
    });
  });

  describe("initHttpServer", () => {
    it("should initialize http server", () => {
      adapter.initHttpServer();
      expect(adapter.getHttpServer()).toBeDefined();
    });
  });

  describe("response helpers", () => {
    it("should handle handler returning value", async () => {
      adapter.get("/test", () => ({ result: "value" }));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);
      const body = await response.json();

      expect(body).toEqual({ result: "value" });
    });

    it("should handle handler returning Response", async () => {
      adapter.get("/test", () => new Response("direct response"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);
      const body = await response.text();

      expect(body).toBe("direct response");
    });
  });

  describe("status and reply methods", () => {
    it("status should return response builder", () => {
      const res = adapter.status({} as Response, 201);
      expect(res).toBeDefined();
    });

    it("reply should return response builder", () => {
      const res = adapter.reply({} as Response, "body", 201);
      expect(res).toBeDefined();
    });
  });

  describe("abstract method implementations", () => {
    it("getRequestHostname should return hostname", () => {
      const req = new Request("http://example.com/path");
      expect(adapter.getRequestHostname(req)).toBe("example.com");
    });

    it("getRequestMethod should return method", () => {
      const req = new Request("http://example.com", { method: "POST" });
      expect(adapter.getRequestMethod(req)).toBe("POST");
    });

    it("getRequestUrl should return pathname", () => {
      const req = new Request("http://example.com/path?foo=bar");
      expect(adapter.getRequestUrl(req)).toBe("/path");
    });

    it("end should be a no-op", () => {
      // Should not throw
      adapter.end({} as Response, "message");
    });

    it("setHeader should return response", () => {
      const res = {} as Response;
      const result = adapter.setHeader(res, "X-Test", "value");
      expect(result).toBe(res);
    });

    it("isHeadersSent should return false", () => {
      expect(adapter.isHeadersSent({} as Response)).toBe(false);
    });

    it("useBodyParser should be a no-op", () => {
      // Should not throw
      adapter.useBodyParser("json");
    });

    it("registerParserMiddleware should set flag", () => {
      adapter.registerParserMiddleware();
      // Just verify it doesn't throw
    });

    it("setViewEngine should be a no-op", () => {
      // Should not throw
      adapter.setViewEngine("ejs");
    });

    it("render should throw not implemented", () => {
      expect(() => adapter.render({} as Response, "view", {})).toThrow("not implemented");
    });

    it("redirect should be a no-op", () => {
      // Should not throw
      adapter.redirect({} as Response, 302, "/new-path");
    });

    it("setLocal should throw not implemented", () => {
      expect(() => adapter.setLocal("key", "value")).toThrow("not implemented");
    });

    it("applyVersionFilter should return handler wrapper", () => {
      const handler = vi.fn();
      const result = adapter.applyVersionFilter(handler, "1", {});
      expect(typeof result).toBe("function");
    });

    it("createMiddlewareFactory should return factory function", () => {
      const factory = adapter.createMiddlewareFactory(0); // GET
      expect(typeof factory).toBe("function");
    });
  });

  describe("static assets", () => {
    it("should serve static files", async () => {
      // Create a temporary test file
      const testDir = "/tmp/bun-adapter-test";
      await Bun.write(`${testDir}/test.txt`, "Hello from static file");

      adapter.useStaticAssets(testDir);

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test.txt`);
      const body = await response.text();

      expect(body).toBe("Hello from static file");
    });

    it("should serve static files with prefix", async () => {
      const testDir = "/tmp/bun-adapter-test2";
      await Bun.write(`${testDir}/test.txt`, "Hello with prefix");

      adapter.useStaticAssets(testDir, { prefix: "/static" });

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/static/test.txt`);
      const body = await response.text();

      expect(body).toBe("Hello with prefix");
    });
  });

  describe("request next with error in handler", () => {
    it("should handle next called with error in handler", async () => {
      adapter.get("/test", (req, res, next) => {
        next(new Error("Handler error"));
      });

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.status).toBe(500);
    });
  });

  describe("invalid JSON body", () => {
    it("should handle invalid JSON gracefully", async () => {
      adapter.post("/test", (req, res) => {
        res.json({ body: req.body });
      });

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "invalid json{",
      });
      const body = await response.json();

      expect(body.body).toBeUndefined();
    });
  });

  describe("Fastify hooks lifecycle", () => {
    it("should handle onRequest hook error", async () => {
      adapter.addHook("onRequest", (req, reply, done) => {
        done(new Error("onRequest error"));
      });
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.status).toBe(500);
    });

    it("should handle preHandler hook error", async () => {
      adapter.addHook("preHandler", (req, reply, done) => {
        done(new Error("preHandler error"));
      });
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.status).toBe(500);
    });

    it("should handle onSend hook error", async () => {
      adapter.addHook("onSend", (req, reply, payload, done) => {
        done(new Error("onSend error"));
      });
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.status).toBe(500);
    });

    it("should execute onResponse hook", async () => {
      const hookSpy = vi.fn((req, reply, done) => done());
      adapter.addHook("onResponse", hookSpy);
      adapter.get("/test", (req, res) => res.send("ok"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      await fetch(`http://localhost:${server?.port}/test`);

      expect(hookSpy).toHaveBeenCalled();
    });

    it("should handle reply sent during onRequest hook", async () => {
      adapter.addHook("onRequest", (req, reply, done) => {
        reply.send("early response");
        done();
      });
      adapter.get("/test", (req, res) => res.send("should not reach"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);
      const body = await response.text();

      expect(body).toBe("early response");
    });

    it("should handle reply sent during preHandler hook", async () => {
      adapter.addHook("preHandler", (req, reply, done) => {
        reply.send("early response");
        done();
      });
      adapter.get("/test", (req, res) => res.send("should not reach"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);
      const body = await response.text();

      expect(body).toBe("early response");
    });
  });

  describe("error middleware chain", () => {
    it("should pass error to next error handler", async () => {
      const firstHandler = vi.fn((err, req, res, next) => {
        next(err); // Pass to next error handler
      });
      const secondHandler = vi.fn((err, req, res, next) => {
        res.status(500).send("Handled by second");
      });

      adapter.use(firstHandler);
      adapter.use(secondHandler);
      adapter.get("/test", () => {
        throw new Error("Test error");
      });

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(await response.text()).toBe("Handled by second");
    });

    it("should handle error handler throwing", async () => {
      adapter.use((err: unknown, req: unknown, res: unknown, next: () => void) => {
        throw new Error("Error handler error");
      });
      adapter.get("/test", () => {
        throw new Error("Original error");
      });

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      expect(response.status).toBe(500);
    });
  });

  describe("middleware not calling next", () => {
    it("should stop chain when next not called and response not ended", async () => {
      adapter.use((req, res, next) => {
        // Don't call next, but don't end response either
      });
      adapter.get("/test", (req, res) => res.send("should not reach"));

      await adapter.listen(0);
      const server = adapter.getHttpServer().server;
      const response = await fetch(`http://localhost:${server?.port}/test`);

      // Response should be empty since middleware didn't end it
      expect(response.status).toBe(200);
    });
  });
});
