import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';
import { setupAppHttp } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(NotificationModule, {
    logger: ['error', 'warn', 'log'],
  });
  await setupAppHttp(app);
  await app.listen(process.env.PORT);
}

bootstrap();
