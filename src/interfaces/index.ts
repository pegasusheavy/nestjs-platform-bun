import type { Server } from "bun";
import type { INestApplication, NestApplicationOptions } from "@nestjs/common";

/**
 * Options for configuring the Bun HTTP server
 */
export interface BunServerOptions {
  /**
   * Port to listen on
   */
  port?: number;

  /**
   * Hostname to bind to
   */
  hostname?: string;

  /**
   * Unix socket path (alternative to port/hostname)
   */
  unix?: string;

  /**
   * Enable development mode for better error messages
   */
  development?: boolean;

  /**
   * Maximum request body size in bytes
   */
  maxRequestBodySize?: number;

  /**
   * TLS configuration
   */
  tls?: {
    key?: string | Buffer | Array<string | Buffer>;
    cert?: string | Buffer | Array<string | Buffer>;
    ca?: string | Buffer | Array<string | Buffer>;
    passphrase?: string;
  };

  /**
   * Enable HTTP/2 (requires TLS)
   */
  lowMemoryMode?: boolean;
}

/**
 * Extended request object with Bun-specific properties
 */
export interface BunRequest extends Request {
  params?: Record<string, string>;
  query?: Record<string, string>;
  parsedBody?: unknown;
}

/**
 * NestJS application instance configured for Bun
 */
export interface NestBunApplication extends INestApplication {
  /**
   * Get the underlying Bun HTTP server instance
   */
  getHttpServer(): Server<unknown>;
}

/**
 * Options for creating a NestJS Bun application
 */
export interface NestBunApplicationOptions extends NestApplicationOptions {
  /**
   * Bun-specific server options
   */
  serverOptions?: BunServerOptions;
}
