// src/main.ts
import { NestFactory } from '@nestjs/core';
import { CheckoutModule } from './checkout.module';
import { setupApp } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(CheckoutModule);
  await setupApp(app);
  await app.listen(process.env.PORT ?? 3333);
}

bootstrap();
