// src/lambda-handler.ts
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { setupApp } from './setup';

import { createServer, proxy } from 'aws-serverless-express';
import { Handler, Context, Callback } from 'aws-lambda';

let cachedServer: any;

async function bootstrapServer() {
  const app = await NestFactory.create(AuthModule);
  await setupApp(app);

  const expressApp = app.getHttpAdapter().getInstance();
  return createServer(expressApp);
}

export const handler: Handler = async (
  event: any,
  context: Context,
  callback: Callback,
) => {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }
  return proxy(cachedServer, event, context, 'PROMISE').promise;
};
