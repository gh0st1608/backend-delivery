import { NestFactory } from '@nestjs/core';
import { OrderModule } from './order.module';
import { setupApp } from './setup';

import { createServer, proxy } from 'aws-serverless-express';
import { Handler } from 'aws-lambda';

let cachedServer: any;

async function bootstrapServer() {
  const app = await NestFactory.create(OrderModule);
  await setupApp(app);
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return createServer(expressApp);
}

export const handler: Handler = async (event, context) => {
  if (!cachedServer) {
    cachedServer = await bootstrapServer();
  }

  return proxy(cachedServer, event, context, 'PROMISE').promise;
};
