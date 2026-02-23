import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupApp } from './setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await setupApp(app);
  await app.listen(process.env.PORT ?? 3333);
}

bootstrap();