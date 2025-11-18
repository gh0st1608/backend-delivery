import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';
import { SQSEmailConsumer } from './infrastructure/consumer/sqs-email.consumer';

let app;

export const handler = async (event) => {
  if (!app) {
    app = await NestFactory.createApplicationContext(NotificationModule);
  }

  const consumer = app.get(SQSEmailConsumer);
  return consumer.handle(event);
};
