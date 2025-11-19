// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { setupApp } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  await setupApp(app);
  await app.listen(process.env.PORT ?? 3333);
}

bootstrap();
