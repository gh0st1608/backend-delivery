// src/bootstrap-app.ts
import {
  INestApplication,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpErrorFilter } from './infrastructure/helper-error.filter';
import { TransformInterceptor } from './infrastructure/transformInterceptor';
import { corsConfig } from './infrastructure/config/cors.config';

export async function setupApp(app: INestApplication): Promise<void> {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor(),
  );

  app.useGlobalFilters(new HttpErrorFilter());

  app.enableCors(corsConfig({ credentials: true }));
}
