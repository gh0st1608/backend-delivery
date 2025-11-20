import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';
import { SQSEmailConsumer } from './infrastructure/consumer/sqs-email.consumer';
import {
  Context,
  Callback,
  SQSEvent,
  SQSHandler,
} from 'aws-lambda';
import { INestApplicationContext } from '@nestjs/common';

let app: INestApplicationContext | null = null;

/**
 * Lambda Handler tipado correctamente para SQS
 */
export const handler: SQSHandler = async (
  event: SQSEvent,
  _context: Context,
  _callback: Callback
): Promise<void> => {
  if (!app) {
    app = await NestFactory.createApplicationContext(NotificationModule);
  }

  const consumer = app.get(SQSEmailConsumer);

  return consumer.handle(event);
};
