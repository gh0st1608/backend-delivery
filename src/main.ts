// src/main.ts
import { NestFactory } from '@nestjs/core';
import { CartModule } from './cart.module';
import { setupApp } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(CartModule);
  await setupApp(app);
  await app.listen(process.env.PORT ?? 3333);
}

bootstrap();
