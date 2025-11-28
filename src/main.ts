// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ShopModule } from './shop.module';
import { setupApp } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(ShopModule);
  await setupApp(app);
  await app.listen(process.env.PORT ?? 3333);
}

bootstrap();
