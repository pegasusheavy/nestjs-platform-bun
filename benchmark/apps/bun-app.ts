import "reflect-metadata";
import { NestBunFactory } from "../../src/index";
import { BenchmarkModule } from "./shared.module";

const PORT = parseInt(process.env.PORT ?? "4003", 10);

async function bootstrap() {
  const app = await NestBunFactory.create(BenchmarkModule, {
    logger: false, // Disable logging for benchmark accuracy
  });

  await app.listen(PORT);
  console.log(`Bun app listening on port ${PORT}`);
}

bootstrap().catch(console.error);
