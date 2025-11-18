import { SendEmailUseCase } from '../../application/send-email.application';
import { SQSEvent } from 'aws-lambda';

export class SQSEmailConsumer {
  constructor(private readonly useCase: SendEmailUseCase) {}

  async handle(event: SQSEvent) {
    for (const record of event.Records) {
      const data = JSON.parse(record.body);

      await this.useCase.execute({
        email: data.email,
        subject: data.subject,
        message: data.message,
      });
    }
  }
}
