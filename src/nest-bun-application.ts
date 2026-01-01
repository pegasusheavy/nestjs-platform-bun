import type { Server } from "bun";
import { NestFactory } from "@nestjs/core";
import type { INestApplication, Type } from "@nestjs/common";
import { BunAdapter } from "./bun-adapter";
import type { NestBunApplication, NestBunApplicationOptions } from "./interfaces";

/**
 * Factory class for creating NestJS applications with Bun HTTP adapter
 */
export class NestBunFactory {
  /**
   * Create a new NestJS application using Bun as the HTTP server
   *
   * @param module - The root module of the application
   * @param options - Optional configuration options
   * @returns A NestJS application configured for Bun
   *
   * @example
   * ```typescript
   * import { NestBunFactory } from '@pegasusheavy/nestjs-platform-bun';
   * import { AppModule } from './app.module';
   *
   * async function bootstrap() {
   *   const app = await NestBunFactory.create(AppModule);
   *   await app.listen(3000);
   *   console.log('Application is running on: http://localhost:3000');
   * }
   *
   * bootstrap();
   * ```
   */
  public static async create<T extends INestApplication = NestBunApplication>(
    module: Type<unknown>,
    options?: NestBunApplicationOptions
  ): Promise<T> {
    const adapter = new BunAdapter();

    const app = await NestFactory.create(module, adapter, {
      ...options,
      // Disable body parser since Bun handles it natively
      bodyParser: false,
    });

    return app as T;
  }

  /**
   * Create a new NestJS application with an existing Bun server instance
   *
   * @param module - The root module of the application
   * @param server - An existing Bun server instance
   * @param options - Optional configuration options
   * @returns A NestJS application configured for Bun
   */
  public static async createWithServer<T extends INestApplication = NestBunApplication>(
    module: Type<unknown>,
    server: Server<unknown>,
    options?: NestBunApplicationOptions
  ): Promise<T> {
    const adapter = new BunAdapter(server);

    const app = await NestFactory.create(module, adapter, {
      ...options,
      bodyParser: false,
    });

    return app as T;
  }
}
