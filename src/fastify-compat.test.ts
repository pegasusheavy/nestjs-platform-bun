import { describe, it, expect, vi } from "vitest";
import {
  createFastifyRequest,
  createFastifyReply,
  FastifyHooksManager,
  FastifyPluginRegistry,
  isFastifyMiddleware,
  markAsFastify,
  type FastifyInstance,
} from "./fastify-compat";

describe("createFastifyRequest", () => {
  it("should create request with basic properties", () => {
    const bunRequest = new Request("http://localhost:3000/path?foo=bar");
    const req = createFastifyRequest(bunRequest, { id: "123" });

    expect(req.raw).toBe(bunRequest);
    expect(req.method).toBe("GET");
    expect(req.url).toBe("/path?foo=bar");
    expect(req.routerPath).toBe("/path");
    expect(req.routerMethod).toBe("GET");
    expect(req.hostname).toBe("localhost");
    expect(req.protocol).toBe("http");
    expect(req.params).toEqual({ id: "123" });
    expect(req.query).toEqual({ foo: "bar" });
    expect(req.is404).toBe(false);
  });

  it("should generate request ID if not provided", () => {
    const bunRequest = new Request("http://localhost");
    const req = createFastifyRequest(bunRequest);

    expect(req.id).toMatch(/^req-/);
  });

  it("should use provided request ID", () => {
    const bunRequest = new Request("http://localhost");
    const req = createFastifyRequest(bunRequest, {}, "custom-id");

    expect(req.id).toBe("custom-id");
  });

  it("should parse headers into object", () => {
    const bunRequest = new Request("http://localhost", {
      headers: { "Content-Type": "application/json", "X-Custom": "value" },
    });
    const req = createFastifyRequest(bunRequest);

    expect(req.headers["content-type"]).toBe("application/json");
    expect(req.headers["x-custom"]).toBe("value");
  });

  it("should get IP from x-forwarded-for", () => {
    const bunRequest = new Request("http://localhost", {
      headers: { "X-Forwarded-For": "192.168.1.1, 10.0.0.1" },
    });
    const req = createFastifyRequest(bunRequest);

    expect(req.ip).toBe("192.168.1.1");
    expect(req.ips).toEqual(["192.168.1.1", "10.0.0.1"]);
  });

  it("should get IP from x-real-ip", () => {
    const bunRequest = new Request("http://localhost", {
      headers: { "X-Real-IP": "10.0.0.1" },
    });
    const req = createFastifyRequest(bunRequest);

    expect(req.ip).toBe("10.0.0.1");
  });

  it("should handle HTTPS protocol", () => {
    const bunRequest = new Request("https://example.com");
    const req = createFastifyRequest(bunRequest);

    expect(req.protocol).toBe("https");
  });

  describe("validation methods", () => {
    it("getValidationFunction should return undefined", () => {
      const bunRequest = new Request("http://localhost");
      const req = createFastifyRequest(bunRequest);

      expect(req.getValidationFunction("body")).toBeUndefined();
    });

    it("compileValidationSchema should return undefined", () => {
      const bunRequest = new Request("http://localhost");
      const req = createFastifyRequest(bunRequest);

      expect(req.compileValidationSchema({}, "body")).toBeUndefined();
    });

    it("validateInput should return true", () => {
      const bunRequest = new Request("http://localhost");
      const req = createFastifyRequest(bunRequest);

      expect(req.validateInput({}, {}, "body")).toBe(true);
    });
  });
});

describe("createFastifyReply", () => {
  it("should create reply with default values", () => {
    const reply = createFastifyReply();

    expect(reply.statusCode).toBe(200);
    expect(reply.sent).toBe(false);
    expect(reply._sent).toBe(false);
    expect(reply.elapsedTime).toBeGreaterThanOrEqual(0);
  });

  describe("code method", () => {
    it("should set status code", () => {
      const reply = createFastifyReply();
      const result = reply.code(201);

      expect(result).toBe(reply);
      expect(reply.statusCode).toBe(201);
      expect(reply._statusCode).toBe(201);
    });
  });

  describe("status method", () => {
    it("should be alias for code", () => {
      const reply = createFastifyReply();
      reply.status(404);

      expect(reply.statusCode).toBe(404);
    });
  });

  describe("statusCode setter", () => {
    it("should set status code", () => {
      const reply = createFastifyReply();
      reply.statusCode = 500;

      expect(reply.statusCode).toBe(500);
      expect(reply._statusCode).toBe(500);
    });
  });

  describe("header method", () => {
    it("should set a single header", () => {
      const reply = createFastifyReply();
      const result = reply.header("X-Custom", "value");

      expect(result).toBe(reply);
      expect(reply._headers.get("X-Custom")).toBe("value");
    });
  });

  describe("headers method", () => {
    it("should set multiple headers", () => {
      const reply = createFastifyReply();
      reply.headers({ "X-One": "one", "X-Two": "two" });

      expect(reply._headers.get("X-One")).toBe("one");
      expect(reply._headers.get("X-Two")).toBe("two");
    });
  });

  describe("getHeader method", () => {
    it("should get header value", () => {
      const reply = createFastifyReply();
      reply.header("X-Test", "value");

      expect(reply.getHeader("X-Test")).toBe("value");
    });

    it("should return null for missing header", () => {
      const reply = createFastifyReply();

      expect(reply.getHeader("X-Missing")).toBeNull();
    });
  });

  describe("getHeaders method", () => {
    it("should get all headers", () => {
      const reply = createFastifyReply();
      reply.headers({ "X-One": "one", "X-Two": "two" });

      const headers = reply.getHeaders();
      expect(headers["x-one"]).toBe("one");
      expect(headers["x-two"]).toBe("two");
    });
  });

  describe("removeHeader method", () => {
    it("should remove header", () => {
      const reply = createFastifyReply();
      reply.header("X-Test", "value");
      reply.removeHeader("X-Test");

      expect(reply.getHeader("X-Test")).toBeNull();
    });
  });

  describe("hasHeader method", () => {
    it("should return true if header exists", () => {
      const reply = createFastifyReply();
      reply.header("X-Test", "value");

      expect(reply.hasHeader("X-Test")).toBe(true);
    });

    it("should return false if header does not exist", () => {
      const reply = createFastifyReply();

      expect(reply.hasHeader("X-Missing")).toBe(false);
    });
  });

  describe("type method", () => {
    it("should set content-type", () => {
      const reply = createFastifyReply();
      reply.type("application/json");

      expect(reply._headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("serializer method", () => {
    it("should set custom serializer", () => {
      const reply = createFastifyReply();
      const customSerializer = (data: unknown) => `custom:${JSON.stringify(data)}`;
      reply.serializer(customSerializer);
      reply.send({ test: true });

      const response = reply._buildResponse();
      // The serializer will be used in _buildResponse
    });
  });

  describe("send method", () => {
    it("should set body and mark as sent", () => {
      const reply = createFastifyReply();
      reply.send({ data: "test" });

      expect(reply._body).toEqual({ data: "test" });
      expect(reply.sent).toBe(true);
      expect(reply._sent).toBe(true);
    });

    it("should warn if already sent", () => {
      const reply = createFastifyReply();
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      reply.send("first");
      reply.send("second");

      expect(warnSpy).toHaveBeenCalledWith("Reply already sent");
      warnSpy.mockRestore();
    });

    it("should handle undefined payload", () => {
      const reply = createFastifyReply();
      reply.send();

      expect(reply.sent).toBe(true);
    });
  });

  describe("redirect method", () => {
    it("should redirect with default 302", () => {
      const reply = createFastifyReply();
      reply.redirect("/new-path");

      expect(reply.statusCode).toBe(302);
      expect(reply._headers.get("Location")).toBe("/new-path");
      expect(reply.sent).toBe(true);
    });

    it("should redirect with custom status", () => {
      const reply = createFastifyReply();
      reply.redirect(301, "/new-path");

      expect(reply.statusCode).toBe(301);
      expect(reply._headers.get("Location")).toBe("/new-path");
    });
  });

  describe("callNotFound method", () => {
    it("should set 404 response", () => {
      const reply = createFastifyReply();
      reply.callNotFound();

      expect(reply.statusCode).toBe(404);
      expect(reply._body).toEqual({
        statusCode: 404,
        error: "Not Found",
        message: "Route not found",
      });
      expect(reply.sent).toBe(true);
    });
  });

  describe("getResponseTime method", () => {
    it("should return elapsed time", async () => {
      const reply = createFastifyReply();
      await new Promise((r) => setTimeout(r, 10));
      const time = reply.getResponseTime();

      expect(time).toBeGreaterThanOrEqual(10);
    });
  });

  describe("elapsedTime getter", () => {
    it("should return elapsed time", async () => {
      const reply = createFastifyReply();
      await new Promise((r) => setTimeout(r, 5));

      expect(reply.elapsedTime).toBeGreaterThanOrEqual(5);
    });
  });

  describe("_buildResponse method", () => {
    it("should build redirect response", () => {
      const reply = createFastifyReply();
      reply.redirect(301, "https://example.com/new");

      const response = reply._buildResponse();
      expect(response.status).toBe(301);
    });

    it("should use custom serializer", async () => {
      const reply = createFastifyReply();
      reply.serializer((data) => `custom:${JSON.stringify(data)}`);
      reply.send({ test: true });

      const response = reply._buildResponse();
      const text = await response.text();
      expect(text).toBe('custom:{"test":true}');
    });

    it("should handle string body", async () => {
      const reply = createFastifyReply();
      reply.send("Hello");

      const response = reply._buildResponse();
      expect(await response.text()).toBe("Hello");
      expect(response.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    });

    it("should handle Uint8Array body", async () => {
      const reply = createFastifyReply();
      reply.send(new Uint8Array([1, 2, 3]));

      const response = reply._buildResponse();
      expect(response.headers.get("Content-Type")).toBe("application/octet-stream");
    });

    it("should handle ArrayBuffer body", async () => {
      const reply = createFastifyReply();
      reply.send(new ArrayBuffer(4));

      const response = reply._buildResponse();
      expect(response.headers.get("Content-Type")).toBe("application/octet-stream");
    });

    it("should handle ReadableStream body", () => {
      const reply = createFastifyReply();
      const stream = new ReadableStream();
      reply.send(stream);

      const response = reply._buildResponse();
      expect(response.body).toBe(stream);
    });

    it("should handle Blob body", () => {
      const reply = createFastifyReply();
      const blob = new Blob(["test"]);
      reply.send(blob);

      const response = reply._buildResponse();
      expect(response.body).toBeDefined();
    });

    it("should handle object body as JSON", async () => {
      const reply = createFastifyReply();
      reply.send({ foo: "bar" });

      const response = reply._buildResponse();
      expect(response.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
      const body = await response.json();
      expect(body).toEqual({ foo: "bar" });
    });

    it("should handle null body", () => {
      const reply = createFastifyReply();
      reply._sent = true;

      const response = reply._buildResponse();
      expect(response.body).toBeNull();
    });

    it("should preserve existing content-type for string", async () => {
      const reply = createFastifyReply();
      reply.type("text/csv");
      reply.send("a,b,c");

      const response = reply._buildResponse();
      expect(response.headers.get("Content-Type")).toBe("text/csv");
    });

    it("should preserve existing content-type for binary", async () => {
      const reply = createFastifyReply();
      reply.type("image/png");
      reply.send(new Uint8Array([1, 2, 3]));

      const response = reply._buildResponse();
      expect(response.headers.get("Content-Type")).toBe("image/png");
    });

    it("should preserve existing content-type for JSON", async () => {
      const reply = createFastifyReply();
      reply.type("application/vnd.api+json");
      reply.send({ foo: "bar" });

      const response = reply._buildResponse();
      expect(response.headers.get("Content-Type")).toBe("application/vnd.api+json");
    });
  });
});

describe("FastifyHooksManager", () => {
  describe("addHook", () => {
    it("should add onRequest hook", async () => {
      const manager = new FastifyHooksManager();
      const hook = vi.fn((req, reply, done) => done());

      manager.addHook("onRequest", hook);

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      await manager.executeOnRequest(request, reply);

      expect(hook).toHaveBeenCalled();
    });

    it("should add preHandler hook", async () => {
      const manager = new FastifyHooksManager();
      const hook = vi.fn((req, reply, done) => done());

      manager.addHook("preHandler", hook);

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      await manager.executePreHandler(request, reply);

      expect(hook).toHaveBeenCalled();
    });

    it("should add onSend hook", async () => {
      const manager = new FastifyHooksManager();
      const hook = vi.fn((req, reply, payload, done) => done());

      manager.addHook("onSend", hook);

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      await manager.executeOnSend(request, reply, "payload");

      expect(hook).toHaveBeenCalled();
    });

    it("should add onError hook", async () => {
      const manager = new FastifyHooksManager();
      const hook = vi.fn((req, reply, error, done) => done());

      manager.addHook("onError", hook);

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      await manager.executeOnError(request, reply, new Error("test"));

      expect(hook).toHaveBeenCalled();
    });

    it("should add onResponse hook", async () => {
      const manager = new FastifyHooksManager();
      const hook = vi.fn((req, reply, done) => done());

      manager.addHook("onResponse", hook);

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      await manager.executeOnResponse(request, reply);

      expect(hook).toHaveBeenCalled();
    });
  });

  describe("executeOnRequest", () => {
    it("should stop on error", async () => {
      const manager = new FastifyHooksManager();
      const error = new Error("test error");
      manager.addHook("onRequest", (req, reply, done) => done(error));
      manager.addHook("onRequest", vi.fn());

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      const result = await manager.executeOnRequest(request, reply);

      expect(result).toBe(error);
    });

    it("should stop if reply is sent", async () => {
      const manager = new FastifyHooksManager();
      const secondHook = vi.fn();

      manager.addHook("onRequest", (req, reply, done) => {
        reply.send("done");
        done();
      });
      manager.addHook("onRequest", secondHook);

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      await manager.executeOnRequest(request, reply);

      expect(secondHook).not.toHaveBeenCalled();
    });

    it("should handle async hooks", async () => {
      const manager = new FastifyHooksManager();
      const hook = vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 10));
      });

      manager.addHook("onRequest", hook);

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      await manager.executeOnRequest(request, reply);

      expect(hook).toHaveBeenCalled();
    });

    it("should handle async hook errors", async () => {
      const manager = new FastifyHooksManager();
      const error = new Error("async error");

      manager.addHook("onRequest", async () => {
        throw error;
      });

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      const result = await manager.executeOnRequest(request, reply);

      expect(result).toBe(error);
    });
  });

  describe("executePreHandler", () => {
    it("should execute all preHandler hooks", async () => {
      const manager = new FastifyHooksManager();
      const hook1 = vi.fn((req, reply, done) => done());
      const hook2 = vi.fn((req, reply, done) => done());

      manager.addHook("preHandler", hook1);
      manager.addHook("preHandler", hook2);

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      await manager.executePreHandler(request, reply);

      expect(hook1).toHaveBeenCalled();
      expect(hook2).toHaveBeenCalled();
    });

    it("should stop on error", async () => {
      const manager = new FastifyHooksManager();
      const error = new Error("preHandler error");

      manager.addHook("preHandler", (req, reply, done) => done(error));

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      const result = await manager.executePreHandler(request, reply);

      expect(result).toBe(error);
    });

    it("should stop if reply is sent", async () => {
      const manager = new FastifyHooksManager();
      const secondHook = vi.fn();

      manager.addHook("preHandler", (req, reply, done) => {
        reply.send("done");
        done();
      });
      manager.addHook("preHandler", secondHook);

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      await manager.executePreHandler(request, reply);

      expect(secondHook).not.toHaveBeenCalled();
    });
  });

  describe("executeOnSend", () => {
    it("should execute hooks and pass payload", async () => {
      const manager = new FastifyHooksManager();
      manager.addHook("onSend", (req, reply, payload, done) => {
        done(undefined, "modified");
      });

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      const result = await manager.executeOnSend(request, reply, "original");

      expect(result.payload).toBe("modified");
    });

    it("should return error if hook fails", async () => {
      const manager = new FastifyHooksManager();
      const error = new Error("onSend error");

      manager.addHook("onSend", (req, reply, payload, done) => {
        done(error);
      });

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      const result = await manager.executeOnSend(request, reply, "original");

      expect(result.error).toBe(error);
    });

    it("should handle async onSend hooks", async () => {
      const manager = new FastifyHooksManager();
      manager.addHook("onSend", async (req, reply, payload, done) => {
        await new Promise((r) => setTimeout(r, 5));
      });

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      const result = await manager.executeOnSend(request, reply, "original");

      expect(result.payload).toBe("original");
    });

    it("should handle async onSend hook errors", async () => {
      const manager = new FastifyHooksManager();
      const error = new Error("async onSend error");

      manager.addHook("onSend", async () => {
        throw error;
      });

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      const result = await manager.executeOnSend(request, reply, "original");

      expect(result.error).toBe(error);
    });

    it("should chain payload modifications", async () => {
      const manager = new FastifyHooksManager();

      manager.addHook("onSend", (req, reply, payload, done) => {
        done(undefined, (payload as string) + " first");
      });
      manager.addHook("onSend", (req, reply, payload, done) => {
        done(undefined, (payload as string) + " second");
      });

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      const result = await manager.executeOnSend(request, reply, "original");

      expect(result.payload).toBe("original first second");
    });

    it("should keep current payload when hook returns undefined", async () => {
      const manager = new FastifyHooksManager();

      manager.addHook("onSend", (req, reply, payload, done) => {
        // Return undefined payload
        done(undefined, undefined);
      });

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      const result = await manager.executeOnSend(request, reply, "original");

      expect(result.payload).toBe("original");
    });
  });

  describe("executeOnError", () => {
    it("should return true if error handled", async () => {
      const manager = new FastifyHooksManager();
      manager.addHook("onError", (req, reply, error, done) => {
        done(); // no error means handled
      });

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      const result = await manager.executeOnError(request, reply, new Error("test"));

      expect(result).toBe(true);
    });

    it("should return true if reply is sent", async () => {
      const manager = new FastifyHooksManager();
      manager.addHook("onError", (req, reply, error, done) => {
        reply.send("error handled");
        done(error);
      });

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      const result = await manager.executeOnError(request, reply, new Error("test"));

      expect(result).toBe(true);
    });

    it("should return false if not handled", async () => {
      const manager = new FastifyHooksManager();
      manager.addHook("onError", (req, reply, error, done) => {
        done(error); // error passed means not handled
      });

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      const result = await manager.executeOnError(request, reply, new Error("test"));

      expect(result).toBe(false);
    });

    it("should handle async onError hooks", async () => {
      const manager = new FastifyHooksManager();
      manager.addHook("onError", async () => {
        await new Promise((r) => setTimeout(r, 5));
      });

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      const result = await manager.executeOnError(request, reply, new Error("test"));

      expect(result).toBe(false);
    });

    it("should handle async onError hook errors", async () => {
      const manager = new FastifyHooksManager();
      manager.addHook("onError", async () => {
        throw new Error("handler error");
      });

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      const result = await manager.executeOnError(request, reply, new Error("test"));

      expect(result).toBe(false);
    });

    it("should return false when no hooks", async () => {
      const manager = new FastifyHooksManager();

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      const result = await manager.executeOnError(request, reply, new Error("test"));

      expect(result).toBe(false);
    });
  });

  describe("executeOnResponse", () => {
    it("should execute all onResponse hooks", async () => {
      const manager = new FastifyHooksManager();
      const hook1 = vi.fn((req, reply, done) => done());
      const hook2 = vi.fn((req, reply, done) => done());

      manager.addHook("onResponse", hook1);
      manager.addHook("onResponse", hook2);

      const request = createFastifyRequest(new Request("http://localhost"));
      const reply = createFastifyReply();
      await manager.executeOnResponse(request, reply);

      expect(hook1).toHaveBeenCalled();
      expect(hook2).toHaveBeenCalled();
    });
  });
});

describe("FastifyPluginRegistry", () => {
  describe("decorator methods", () => {
    it("should decorate instance", () => {
      const registry = new FastifyPluginRegistry();
      registry.decorate("test", { value: 123 });

      expect(registry.hasDecorator("test")).toBe(true);
      expect(registry.getDecorator("test")).toEqual({ value: 123 });
    });

    it("should decorate request", () => {
      const registry = new FastifyPluginRegistry();
      registry.decorateRequest("user", null);

      expect(registry.hasRequestDecorator("user")).toBe(true);
    });

    it("should decorate reply", () => {
      const registry = new FastifyPluginRegistry();
      registry.decorateReply("timing", null);

      expect(registry.hasReplyDecorator("timing")).toBe(true);
    });

    it("should return undefined for missing decorator", () => {
      const registry = new FastifyPluginRegistry();

      expect(registry.getDecorator("missing")).toBeUndefined();
    });

    it("should return false for missing decorators", () => {
      const registry = new FastifyPluginRegistry();

      expect(registry.hasDecorator("missing")).toBe(false);
      expect(registry.hasRequestDecorator("missing")).toBe(false);
      expect(registry.hasReplyDecorator("missing")).toBe(false);
    });
  });

  describe("register and initializePlugins", () => {
    it("should register and initialize plugins", async () => {
      const registry = new FastifyPluginRegistry();
      const pluginFn = vi.fn((instance, opts, done) => done());

      registry.register(pluginFn, { option: "value" });

      const mockInstance = {} as FastifyInstance;
      await registry.initializePlugins(mockInstance);

      expect(pluginFn).toHaveBeenCalledWith(mockInstance, { option: "value" }, expect.any(Function));
    });

    it("should handle async plugins", async () => {
      const registry = new FastifyPluginRegistry();
      const asyncPlugin = vi.fn(async () => {
        await new Promise((r) => setTimeout(r, 5));
      });

      registry.register(asyncPlugin);

      const mockInstance = {} as FastifyInstance;
      await registry.initializePlugins(mockInstance);

      expect(asyncPlugin).toHaveBeenCalled();
    });

    it("should handle plugin errors", async () => {
      const registry = new FastifyPluginRegistry();
      const error = new Error("plugin error");

      registry.register((instance, opts, done) => done(error));

      const mockInstance = {} as FastifyInstance;

      await expect(registry.initializePlugins(mockInstance)).rejects.toThrow("plugin error");
    });

    it("should handle async plugin errors", async () => {
      const registry = new FastifyPluginRegistry();

      registry.register(async () => {
        throw new Error("async plugin error");
      });

      const mockInstance = {} as FastifyInstance;

      await expect(registry.initializePlugins(mockInstance)).rejects.toThrow("async plugin error");
    });

    it("should use empty opts if not provided", async () => {
      const registry = new FastifyPluginRegistry();
      const pluginFn = vi.fn((instance, opts, done) => done());

      registry.register(pluginFn);

      const mockInstance = {} as FastifyInstance;
      await registry.initializePlugins(mockInstance);

      expect(pluginFn).toHaveBeenCalledWith(mockInstance, {}, expect.any(Function));
    });
  });

  describe("applyRequestDecorators", () => {
    it("should apply request decorators", () => {
      const registry = new FastifyPluginRegistry();
      registry.decorateRequest("user", { id: 1 });

      const request = createFastifyRequest(new Request("http://localhost"));
      registry.applyRequestDecorators(request);

      expect((request as Record<string, unknown>).user).toEqual({ id: 1 });
    });

    it("should call function decorators", () => {
      const registry = new FastifyPluginRegistry();
      registry.decorateRequest("timestamp", () => Date.now());

      const request = createFastifyRequest(new Request("http://localhost"));
      registry.applyRequestDecorators(request);

      expect((request as Record<string, unknown>).timestamp).toBeDefined();
    });
  });

  describe("applyReplyDecorators", () => {
    it("should apply reply decorators", () => {
      const registry = new FastifyPluginRegistry();
      registry.decorateReply("custom", "value");

      const reply = createFastifyReply();
      registry.applyReplyDecorators(reply);

      expect((reply as Record<string, unknown>).custom).toBe("value");
    });

    it("should call function decorators", () => {
      const registry = new FastifyPluginRegistry();
      registry.decorateReply("timestamp", () => Date.now());

      const reply = createFastifyReply();
      registry.applyReplyDecorators(reply);

      expect((reply as Record<string, unknown>).timestamp).toBeDefined();
    });
  });
});

describe("isFastifyMiddleware", () => {
  it("should return true for marked functions", () => {
    const fn = () => {};
    markAsFastify(fn);

    expect(isFastifyMiddleware(fn)).toBe(true);
  });

  it("should return false for unmarked functions", () => {
    const fn = () => {};

    expect(isFastifyMiddleware(fn)).toBe(false);
  });
});

describe("markAsFastify", () => {
  it("should mark function and return it", () => {
    const fn = () => {};
    const result = markAsFastify(fn);

    expect(result).toBe(fn);
    expect((fn as Record<string, unknown>)._fastify).toBe(true);
  });
});
