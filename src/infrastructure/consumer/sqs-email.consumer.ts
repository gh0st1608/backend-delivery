import { Injectable } from '@nestjs/common';
import { SendEmailUseCase } from '../../application/send-email.application';
import {
  SQSEvent,
  SQSRecord,
} from 'aws-lambda';

interface EmailVerificationPayload {
  email: string;
  subject: string;
  message: string;
}

@Injectable()
export class SQSEmailConsumer {
  constructor(private readonly useCase: SendEmailUseCase) {}

  async handle(event: SQSEvent): Promise<void> {
    try {
      for (const record of event.Records) {
        const parsed: unknown = JSON.parse(record.body);
        console.log('parsed', parsed)

        /**
         * EventBridge → SQS estructura:
         * {
         *    "detail": {
         *        "name": "...",
         *        "payload": { email, subject, message }
         *    }
         * }
         */
        const payload: EmailVerificationPayload =
          (parsed as any)?.detail?.payload;

        if (!payload) {
          console.error('❌ Payload inválido en SQS record:', parsed);
          continue;
        }

        await this.useCase.execute({
          email: payload.email,
          subject: payload.subject,
          message: payload.message,
        });
      }
    } catch (error) {
      console.error('❌ Error procesando SQS:', error);
    }
  }
}
