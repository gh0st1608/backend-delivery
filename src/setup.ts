// src/setup.ts (o bootstrap-app.ts si prefieres)
import {
  INestApplication,
  INestApplicationContext,
  ValidationPipe,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpErrorFilter } from './infrastructure/helper-error.filter';
import { TransformInterceptor } from './infrastructure/transformInterceptor';

export async function setupAppHttp(app: INestApplication): Promise<void> {
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

  app.enableCors({
    origin: ['*'],
    methods: ['*'],
  });

  await app.init();
}

// Para Lambdas sin HTTP server (opcionalmente vacío si no necesitas nada)
export async function setupAppContext(app: INestApplicationContext): Promise<void> {
  // Por ahora no necesitas filtros, pipes ni CORS aquí
  await app.init();
}