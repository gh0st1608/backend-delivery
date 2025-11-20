import { Controller, Post, Body } from '@nestjs/common';
import { SQSEvent, SQSRecord } from 'aws-lambda';
import { SQSEmailConsumer } from '../consumer/sqs-email.consumer';
import { createMockSqsEvent } from '../utils/fake-event';

@Controller('notification')
export class NotificationController {
  constructor(private readonly consumer: SQSEmailConsumer) {}

  @Post('send-email')
  async emulate(@Body() body: any) {
    return this.consumer.handle(createMockSqsEvent(body));
  }
}
