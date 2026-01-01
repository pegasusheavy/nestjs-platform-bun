import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { BenchmarkModule } from "./shared.module";

const PORT = parseInt(process.env.PORT ?? "4001", 10);

async function bootstrap() {
  const app = await NestFactory.create(BenchmarkModule, {
    logger: false, // Disable logging for benchmark accuracy
  });

  await app.listen(PORT);
  console.log(`Express app listening on port ${PORT}`);
}

bootstrap().catch(console.error);
