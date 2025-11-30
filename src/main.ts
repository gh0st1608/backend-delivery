// src/main.ts
import { NestFactory } from '@nestjs/core';
import { OrderModule } from './order.module';
import { setupApp } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(OrderModule);
  await setupApp(app);
  await app.listen(process.env.PORT ?? 3333);
}

bootstrap();
