import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { BenchmarkModule } from "./shared.module";

const PORT = parseInt(process.env.PORT ?? "4002", 10);

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    BenchmarkModule,
    new FastifyAdapter(),
    {
      logger: false, // Disable logging for benchmark accuracy
    }
  );

  await app.listen(PORT, "0.0.0.0");
  console.log(`Fastify app listening on port ${PORT}`);
}

bootstrap().catch(console.error);
