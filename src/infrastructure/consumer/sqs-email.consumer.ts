import { Injectable } from '@nestjs/common';
import { SendEmailUseCase } from '../../application/send-email.application';
import { SQSEvent } from 'aws-lambda';

@Injectable()
export class SQSEmailConsumer {
  constructor(private readonly useCase: SendEmailUseCase) {}

  async handle(event: SQSEvent) {
    try {
      for (const record of event.Records) {
        const data = JSON.parse(record.body);
        await this.useCase.execute({
          email: data.email,
          subject: data.subject,
          message: data.message,
        });
      }
    } catch (error) {
      console.log('error', error);
    }
  }
}
