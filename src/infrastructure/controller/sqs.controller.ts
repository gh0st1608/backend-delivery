import { Controller, Post, Body } from '@nestjs/common';
import { SQSEmailConsumer } from '../consumer/sqs-email.consumer';

@Controller('notification')
export class NotificationController {
  constructor(private readonly consumer: SQSEmailConsumer) {}

  @Post('send-email')
  async emulateSqs(@Body() body: any) {
    const sqsEvent = {
      Records: [
        {
          body: JSON.stringify(body),
        },
      ],
    };

    return this.consumer.handle(sqsEvent);
  }
}
