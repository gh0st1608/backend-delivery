import { Controller, Post, Body } from '@nestjs/common';
import { SQSEmailConsumer } from '../consumer/sqs-email.consumer';

@Controller()
export class NotificationController {
  constructor(private readonly consumer: SQSEmailConsumer) {}

  @Post('sqs-email')
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
