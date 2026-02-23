// src/main.ts
import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';
import { setupApp } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(PaymentModule);
  await setupApp(app);
  await app.listen(process.env.PORT ?? 3333);
}

bootstrap();
